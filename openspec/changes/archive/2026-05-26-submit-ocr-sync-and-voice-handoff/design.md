## Context

Ekran `apps/mobile/app/(app)/projects/[id]/images.tsx` w istniejącym projekcie (poza kreatorem `new/`) udostępnia dolne menu `AudioFlowFooterMenu` z trzema akcjami: Galeria, „Zapisz zmiany" (środkowy `createIcon='check'`) i Aparat. Obecna funkcja `handleSaveChanges` jedynie:

1. wywołuje `uploadAssets(pendingAssets)` jeśli są oczekujące zdjęcia z galerii/aparatu (czyli już wysłane przez przycisk „Wyślij zdjęcia" panelu pendingów byłyby zerowe),
2. zeruje flagę `hasChanges`.

Backend ma już zaimplementowane:
- `POST /projects/:projectId/process-ocr-batch` w `apps/api/src/routes/ocr.ts`, które domyślnie (bez `force`) działa inkrementalnie: tworzy sceny dla obrazów bez sceny, reprocesuje sceny z `ocrText=null` lub `status ∈ {queued, ocr_error}`, ale pomija `ocr_done`/`ready_for_audio`. Z `force=true` resetuje wszystkie sceny do `queued` i czyści teksty.
- `DELETE /projects/:projectId/images/:imageId` w `apps/api/src/routes/images.ts`, które usuwa plik `storagePath` i `thumbnailPath` z S3 oraz rekord `PageImage`. Schemat Prisma (`apps/api/prisma/schema.prisma`) ma `onDelete: Cascade` na: `TextRegion → PageImage`, `Scene → PageImage`, `AudioTrack → Scene`. Cascade DB jest poprawne, ale plik audio w `AudioTrack.storagePath` nie jest usuwany ze storage przy kasowaniu obrazu.

Ekran `voice.tsx` poolinguje sceny `audio_generating`, pokazuje alert po zakończeniu generacji, ma sekcję statusu TTS — nie ma mechanizmu podświetlenia konkretnego podzbioru scen jako „nowych".

Stakeholders: pojedynczy autor projektu (właściciel). Zmiana nie dotyka uprawnień shared.

## Goals / Non-Goals

**Goals:**
- Jednoznaczny przycisk submitu w stopce `images.tsx`, który wykonuje pełną synchronizację: upload pendingów → OCR inkrementalny → sprzątanie osieroconych artefaktów storage → nawigacja do `voice.tsx`.
- Widoczne komunikaty postępu (overlay z listą plików + faza „OCR w toku" + faza „Sprzątanie"). Brak cichych failów.
- Backend `DELETE /images/:imageId` sprząta pliki audio z S3 przed kaskadowym usunięciem DB.
- Ekran głosu otrzymuje listę `sceneId[]` świeżo zsynchronizowanych obrazów i wizualnie je wyróżnia.
- Zachowana kompatybilność z istniejącym kontraktem `process-ocr-batch` (response: `SceneResponse[]`).

**Non-Goals:**
- Nie zmienia się kontrakt `POST /projects/:projectId/images` (upload), `POST /scenes/process-ocr` (legacy), `POST /audio/generate`.
- Nie zmienia się polityka uprawnień, sharingu, planów, limitów (`checkPageLimit` pozostaje na backendzie).
- Nie modyfikujemy dostawcy OCR (Google/mock), schematu storage, schematu Prisma.
- Nie modyfikujemy zachowania przycisku „Generuj audio" w `voice.tsx`.
- Nie wprowadzamy kolejki asynchronicznej/job runnera — OCR pozostaje w obrębie request/response (jak dziś, blokujące przez czas trwania batcha).

## Decisions

### Decyzja 1: Submit jest jednym kliknięciem, nie dwoma

**Wybór:** Przycisk środkowy stopki staje się „Wyślij i przetwórz" (`createLabel`, `createIcon='check'`). Po kliknięciu:

1. jeśli `pendingAssets.length > 0` → `uploadAssets(pendingAssets)` (jak dziś),
2. POST `process-ocr-batch` (bez `force`, opcjonalnie `markReadyForAudio=false`),
3. nawigacja `router.replace('/(app)/projects/{id}/voice?newSceneIds=...')`.

Wycofany przycisk panelu pendingów „Wyślij zdjęcia" pozostaje (UX: chcemy pokazać, że pliki zostały zaakceptowane do listy przed całościowym submitem). Można też kliknąć stopkę bez wcześniejszego „Wyślij zdjęcia" — submit ma sam wykonać upload pendingów. Reguła: pendingi zawsze uploadowane przed OCR.

**Alternatywa odrzucona:** dwa osobne przyciski w stopce (Upload + OCR). Powiększa CTA-noise i mnoży decyzje użytkownika.

### Decyzja 2: Backend `DELETE /images/:imageId` sprząta `AudioTrack.storagePath`

**Wybór:** Przed `prisma.pageImage.delete` route wczytuje powiązaną `Scene` i jej `AudioTrack` (przez `include`), iteruje po wszystkich plikach audio i wywołuje `deleteFile(track.storagePath)`. Dopiero potem usuwa wiersz `PageImage` (cascade DB usuwa scenę i track).

Plik obrazu i thumbnail nadal usuwane są tak jak teraz. Błędy storage są tłumione (jak dziś przy obrazach) — DB cleanup ma priorytet, żeby nie zostawiać sierot w DB.

**Alternatywa odrzucona:** dedykowany endpoint `POST /projects/:id/cleanup-orphans`, który omiata całe S3. Zbyt szerokie blast-radius i opóźnia sprzątanie do submitu.

### Decyzja 3: Lista „nowych" scen przekazywana przez query param routera

**Wybór:** Po sukcesie `process-ocr-batch` mobile porównuje aktualną listę scen z `getScenes(id)` wykonaną **przed** submitem (snapshot scenarioId) i wyodrębnia nowo utworzone. Przekazuje przez `router.replace({ pathname: '/(app)/projects/[id]/voice', params: { id, newSceneIds: 'id1,id2' } })`. Ekran `voice.tsx` czyta `useLocalSearchParams`, parsuje `newSceneIds` na `Set<string>` i podświetla pasujące sceny w sekcji statusu (kolor `accent.pearl`, dopisek „Nowe").

Alternatywa: backend zwraca w odpowiedzi flagę `isNew` per scenie. Wymagałoby zmiany `SceneResponse` w `packages/shared` — szersza zmiana kontraktu niż konieczna. Wynik klienta jest dokładnie taki sam.

### Decyzja 4: Tryb inkrementalny domyślny, `force` pozostaje opcjonalny

**Wybór:** Klient nie wysyła `force=true` w nowym przepływie submitu. Backend już tak działa, ale dodajemy test, który gwarantuje, że scena w stanie `ocr_done` lub `ready_for_audio` nie zostanie zreprocesowana, jeśli powiązany `pageImage` nie jest nowy. Edge case: scena z `ocr_error` zostanie zreprocesowana — to pożądane (re-try gratis).

Konfiguracja: brak nowych zmiennych env. Limit `checkPageLimit` już działa per `newImages.length`.

### Decyzja 5: Overlay submitu pokazuje fazy

**Wybór:** Rozbudowujemy istniejący `uploadOverlay` w `images.tsx` o stan „phase": `uploading | ocr | cleanup | done`. Tekst stanu (Polski) jest tłumaczony in-place: „Wysyłanie zdjęć…", „Rozpoznawanie tekstu (OCR)…", „Porządkowanie usuniętych plików…". Po fazie `done` wykonujemy `router.replace`.

Nie wprowadzamy nowego komponentu progressu — reużywamy `GlassPanel` + `ActivityIndicator` + listy `fileProgress`. To trzyma sygnaturę overlaya zgodną z dotychczasowym UX.

### Decyzja 6: Brak modyfikacji `packages/shared`

`process-ocr-batch` nadal zwraca `SceneResponse[]`. Mobile sam diffuje sceny przed/po. Brak zmian w `SceneResponse`. To zmniejsza blast-radius i nie dotyka playera/playlist.

## Risks / Trade-offs

- **Risk:** Długi czas trwania `process-ocr-batch` (Google Vision na wielu nowych zdjęciach) → przycisk submitu blokuje UI minutami. **Mitigation:** overlay z `ActivityIndicator`, faza OCR pokazuje liczbę nowych scen z `getScenes` po creacji. Nie wprowadzamy job queue (poza scope), ale tekst wyraźnie informuje, że trwa rozpoznawanie. Po przekroczeniu rozsądnego timeoutu (np. 60s) klient pokazuje przycisk „Sprawdź status" prowadzący na `voice.tsx` bez czekania.
- **Risk:** Storage cleanup `AudioTrack` może rzucić wyjątek (S3 niedostępne) → DB delete nadal się wykona, plik zostaje sierotą. **Mitigation:** błędy storage są logowane (`console.warn`) i połykane — DB ma priorytet, sierota S3 jest akceptowalna (jak dla obecnego cleanupu obrazów). Można dodać prosty endpoint orphan-sweep w przyszłości (poza scope).
- **Risk:** Lista `newSceneIds` w URL query może być długa (limit ~2KB). **Mitigation:** dla projektów >50 nowych scen przekazujemy tylko 50 ID, resztę liczymy „nowymi" poprzez heurystykę „status=queued/ocr_done bez audioTrack". Akceptowalna utrata wierności podświetlenia dla edge-case.
- **Risk:** Użytkownik klika submit bez żadnych zmian (brak pendingów, brak usunięć, brak nowych obrazów) → niepotrzebny request OCR. **Mitigation:** klient sprawdza `hasChanges` przed wywołaniem; jeśli `false` i brak pendingów, submit jest disabled (zachowane obecne `createDisabled={!hasChanges}`).
- **Risk:** Backend kompatybilność. `process-ocr-batch` reprocesuje `ocr_error` — może zmienić oczekiwania testów. **Mitigation:** istniejący test `ocr-batch-route.test.ts` rozszerzamy, nie nadpisujemy.
- **Trade-off:** Diff scen po stronie klienta zamiast w backendzie kosztuje dodatkowy request `getScenes` przed submitem. Akceptowalne — i tak wykonujemy `loadImages` w `useFocusEffect`.
- **Backwards-compat:** API response kształt bez zmian. Deep linki bez zmian. Offline cache audio bez zmian (cascade delete zostawia `cachedAudio` osieroconym po stronie urządzenia — to istniejący problem, poza scope).
