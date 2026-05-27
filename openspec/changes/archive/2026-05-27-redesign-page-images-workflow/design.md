## Context

Krok 2 kreatora i edycja istniejącego projektu są dziś rozbite na trzy ekrany nawigacyjne: „Zdjęcia stron" (`apps/mobile/app/(app)/projects/[id]/images.tsx`), „Sceny OCR" (`projects/[id]/scenes`) i „Głos lektora" (`projects/[id]/voice`), plus osobna trasa edycji rejonów (`projects/[id]/text-regions/[pageImageId]`) i edycji sceny (`projects/[id]/scenes/[sceneId]`). Submit na ekranie zdjęć dziś tylko synchronizuje pliki i nawiguje dalej.

Stan obecny po stronie klienta:

- `images.tsx` trzyma `images`, `regionCounts`, `pendingAssets`, `hasChanges`, `submitPhase: 'idle' | 'uploading' | 'ocr' | 'done'` oraz overlay uploadu.
- `AudioFlowFooterMenu` (`components/audioflow.tsx`) ma już trzy sloty: lewy (`onLibraryPress`/`leftIcon`/`leftLabel`), środkowy (`onCreatePress`/`createIcon`/`createDisabled`) i prawy (`onPlayerPress`/`rightIcon`/`rightLabel`). Sloty są w pełni parametryzowalne — galeria/aparat to zmiana ikon i handlerów, bez zmiany komponentu.
- Klient API (`lib/api.ts`) ma już: `reorderImages`, `deleteImage`, `processOcrBatch` (`POST /projects/:id/process-ocr-batch`), `getScenes`, `saveTextRegions`, `getTextRegions`, `getScene`, `updateScene`, `generateAudio` (`POST /projects/:id/generate-audio`), `getAudioTracks`, `buildPlaylist`.
- `PageImageCard` (`components/PageImageCard.tsx`) jest współdzielony przez kreator i ekran zdjęć (zachować ten kontrakt).

Stan obecny po stronie API (bez zmian kontraktu):

- `POST /projects/:id/process-ocr-batch` (`routes/ocr.ts`) — zwraca 202, OCR w tle, idempotentny dla scen już przetworzonych.
- `POST /projects/:id/generate-audio` (`routes/audio.ts`) — zwraca 202, TTS w tle dla scen w stanie `ready_for_audio`.
- `POST /projects/:id/build-playlist` (`routes/playlist.ts`) — przeplata audio scen z wstawkami.
- Statusy sceny (`packages/shared`): `queued → ocr_processing → ocr_done → needs_review → ready_for_audio → audio_generating → audio_done` (plus `*_error`). `updateScene({ editedText, status })` zapisuje korektę i ustawia scenę na `ready_for_audio`.

Ograniczenia: zachować kontrakt REST `{ error, message, statusCode }`, zachować zachowanie 202 + przetwarzanie w tle, idempotencję i częściowe niepowodzenia endpointów OCR/TTS. App celuje w web + iOS + Android. Brak nowych sekretów. Bez zmian w dostawcach OCR/TTS, storage, auth, planach.

## Goals / Non-Goals

**Goals:**

- Jeden samodzielny ekran (Krok 2) prowadzący cały proces: dodanie zdjęć → (opcjonalnie obszary) → submit → OCR → (opcjonalnie korekta) → TTS → szczegóły audiobooka.
- Modale dla wyboru obszarów OCR i korekty tekstu OCR zamiast nawigacji do osobnych tras.
- Przeprojektowana karta zdjęcia z uchwytem drag-and-drop (numer porządkowy), rzędem ikon statusu (obszary → OCR → audio) i akcjami edycja/kosz.
- Reorder wyłącznie przez drag-and-drop, działający na web i natywnie.
- Orkiestracja OCR→TTS w całości po stronie klienta na bazie istniejących endpointów (bez nowego endpointu „submit-all", jeśli da się tego uniknąć).

**Non-Goals:**

- Zmiana Kroku 1 (tytuł, lektor, język, wstawki).
- Zmiana dostawców OCR/TTS, storage, auth, planów/limitów, logiki odtwarzacza poza wejściem na szczegóły po sukcesie.
- Zmiana kontraktu REST lub modelu rozliczeń.

## Decisions

### D1. Orkiestracja submitu po stronie klienta z odpytywaniem statusów scen

Submit w `images.tsx` rozszerza maszynę faz: `'idle' | 'uploading' | 'ocr' | 'correction' | 'tts' | 'done' | 'error'`. Sekwencja:

1. `uploading` — wyślij `pendingAssets`, zsynchronizuj usunięcia i kolejność (`reorderImages`).
2. `ocr` — wywołaj `processOcrBatch`, następnie odpytuj `getScenes` aż wszystkie sceny osiągną stan ≥ `ocr_done` (lub `ocr_error`).
3. Jeśli przełącznik „korekta OCR" włączony → przejdź do `correction` (zatrzymaj proces, odblokuj akcję „Korekta OCR" per zdjęcie); użytkownik zatwierdza i ponawia. Jeśli wyłączony → pomiń.
4. `tts` — wywołaj `generateAudio`, odpytuj `getScenes`/`getAudioTracks` aż sceny osiągną `audio_done` (lub `audio_error`).
5. `done` — `buildPlaylist`, pokaż „Wszystkie zdjęcia zostały przetworzone", nawiguj do szczegółów audiobooka.

**Dlaczego, a nie nowy endpoint „submit-all":** endpointy OCR/TTS już zwracają 202 i pracują w tle z idempotencją; klient i tak musi pokazywać fazy postępu. Reużycie nie zmienia kontraktu API i jest mniej ryzykowne niż nowy orkiestrujący endpoint. Odpytywanie spójne z obecnym wzorcem ekranu „Głos lektora".
**Alternatywa odrzucona:** nowy endpoint `POST /projects/:id/finalize` orkiestrujący OCR→TTS→playlist serwerowo. Daje atomowość, ale wymaga nowego kontraktu, kolejki postępu (SSE/poll) i duplikuje istniejącą logikę. Zostawione jako Open Question, jeśli odpytywanie okaże się zbyt chybotliwe.

### D2. „OCR tylko na obszarach" i „TTS tylko na zmienionym tekście" przez istniejące stany, nie nowe pola

- OCR per zdjęcie warunkowo: jeśli zdjęcie ma zapisane `TextRegion` (przez `saveTextRegions`), backend OCR-uje te obszary; jeśli nie — całe zdjęcie. To zachowanie już istnieje w `process-ocr-batch`; nie dodajemy pól.
- TTS per zdjęcie warunkowo: scena bez audio jest w `ready_for_audio` → syntezowana; scena z `audio_done`, której tekst nie zmieniono, jest pomijana przez `generate-audio` (idempotencja). Korekta przez `updateScene({ editedText })` ustawia scenę z powrotem na `ready_for_audio` → ponowna synteza tylko zmienionych.

**Dlaczego:** mapowanie „zmieniony tekst → re-TTS" pokrywa się 1:1 z istniejącą semantyką statusów scen. Brak migracji danych.
**Ryzyko do weryfikacji:** trzeba potwierdzić, że `generate-audio` pomija sceny w `audio_done` i przetwarza tylko `ready_for_audio` — patrz Open Questions.

### D3. Modale hostowane na ekranie zdjęć (RN `Modal`), bez nowych tras

`OcrRegionEditor` i nowy `OcrCorrectionModal` renderowane przez built-in `Modal` z React Native, ze stanem hosta w `images.tsx` (`regionModalPageId: string | null`, `correctionModalSceneId: string | null`). Trasy `projects/[id]/text-regions/[pageImageId]` i `projects/[id]/scenes/[sceneId]` w tym przepływie nie są używane do nawigacji.

**Dlaczego built-in `Modal`, nie nowa zależność (`react-native-modal`):** zero nowych zależności, działa cross-platform, wystarcza dla pełnoekranowego edytora i formularza korekty.
**Współdzielenie:** `OcrRegionEditor` pozostaje jedynym komponentem edytora — kreator (tryb zaawansowany) i ekran zdjęć renderują ten sam komponent, tylko host się różni (modal vs ewentualna trasa kreatora). Spełnia `unified-ocr-region-editor`.

### D4. Drag-and-drop reorder — wybór biblioteki (NOWA ZALEŻNOŚĆ)

Żadna z bibliotek DnD nie jest dziś zainstalowana (`react-native-reanimated`, `react-native-gesture-handler`, `react-native-draggable-flatlist` — wszystkie MISSING). Reorder musi działać na web + native. Rekomendacja: dodać `react-native-draggable-flatlist` wraz z peer-deps `react-native-reanimated` i `react-native-gesture-handler` (wersje zgodne z Expo SDK 54), opakować listę w `GestureHandlerRootView`.

**Dlaczego:** to standard dla reorderowalnych list w Expo, dobrze utrzymywany, integruje się z `FlatList` (obecnie używanym). Numer porządkowy w uchwycie liczony z `index` renderItem, przeliczany automatycznie po `onDragEnd` → `reorderImages`.
**Ryzyko web:** wsparcie web `draggable-flatlist` bywa ograniczone; ekran już ma webowy HTML drag-drop dla plików (`dropRef`/`isDragOver`). **DECYZJA (użytkownik 2026-05-26):** „Tylko mobile teraz, web później" — na native używamy `draggable-flatlist`, na web reorder przez przeciąganie jest chwilowo wyłączony (zwykła lista bez DnD, kolejność z backendu zachowana). Web fallback DnD do dodania w przyszłej zmianie.
**Alternatywy odrzucone:** custom PanResponder (dużo kodu, kruchy); `react-native-reorderable-list` (mniejsza adopcja). Decyzja niewiążąca — weryfikacja kompatybilności z SDK 54 w pierwszym zadaniu.

### D5. Ustawienia ogólne i status kart jako stan ekranu (bez persystencji backendowej)

Przełączniki „wybór obszarów" i „korekta OCR" oraz tryb „edycja" karty żyją w stanie `images.tsx` (domyślnie wyłączone), resetowane przy wejściu na ekran (`useFocusEffect`). Status ikon na karcie wyliczany z danych już dostępnych:

- obszary: `regionCounts[pageImageId]` (>0 = aktywna z licznikiem; przełącznik off = wyszarzona „A").
- OCR: scena powiązana ze zdjęciem w stanie ≥ `ocr_done`.
- audio: istnieje `AudioTrack` dla sceny (z `getAudioTracks`) albo scena w `audio_done`.

**Dlaczego:** brak nowych pól w Prisma/`shared`; stan UI nie musi przetrwać restartu. Zgodne z Non-Goal „bez zmian modelu danych", o ile mapowanie zdjęcie→scena→audio jest dostępne (jest, przez `getScenes` + `getAudioTracks`).

### D6. Dynamiczny tytuł i footer galeria/aparat

Tytuł ustawiany dynamicznie (`navigation.setOptions({ title })` lub `Stack.Screen options`): „Dodaj zdjęcia" gdy `images.length + pendingAssets.length === 0`, inaczej „Edytuj zdjęcia". Footer: lewy slot → ikona galerii + `launchImageLibraryAsync`; prawy slot → ikona aparatu + `launchCameraAsync`; środek → submit (`createIcon='check'`, `createLabel='Wyślij i przetwórz'`, `createDisabled` gdy brak zmian).

## Risks / Trade-offs

- **DnD na web** → `draggable-flatlist` może nie działać na web. Mitygacja: warstwa `Platform.select` — native używa `draggable-flatlist`, web używa istniejącego HTML5 DnD/fallback; oba wołają ten sam `reorderImages`. Zweryfikować w pierwszym zadaniu, ewentualnie zmienić bibliotekę.
- **Nowe peer-deps (reanimated/gesture-handler)** → zmiany w konfiguracji Expo (babel plugin reanimated, `GestureHandlerRootView` w roocie) mogą wpłynąć na cały app i testy Jest. Mitygacja: dodać mocki w jest setup, uruchomić pełny `test:mobile`.
- **Odpytywanie statusów (poll) zamiast push** → ryzyko długiego oczekiwania / chybotliwego UI dla wielu zdjęć. Mitygacja: backoff + limit prób + jawne fazy w overlay; przy timeoutcie pokaż błąd, zostaw użytkownika na ekranie. Eskalacja: serwerowy `finalize` (D1 alternatywa).
- **Częściowe niepowodzenia OCR/TTS** → część scen `*_error`. Mitygacja: przerwij sekwencję, overlay zamknięty, toast/Alert z komunikatem backendu, użytkownik zostaje na ekranie; ikony statusu kart pokazują, które zdjęcia się nie udały.
- **Usuwanie zdjęć kaskaduje audio w S3** → zachować istniejące zachowanie `deleteImage` (kasacja obrazu, thumbnaila i powiązanych `AudioTrack`). Bez zmian kontraktu.
- **Trasy legacy** (`text-regions`, `scenes`, `voice`) → deep linki mogą celować w usunięte ekrany. Mitygacja: zdjąć je z nawigatora dla tego przepływu zgodnie ze specami; jeśli używane gdzie indziej, najpierw zlokalizować referencje (`router.push`) i przekierować.

## Migration Plan

1. Dodać i zweryfikować zależności DnD (D4); zaktualizować konfigurację Expo + mocki Jest.
2. Przebudować `PageImageCard` na układ trzykolumnowy (`page-image-status-card`); zachować współdzielenie z kreatorem.
3. Dodać `OcrCorrectionModal` i host modalny dla `OcrRegionEditor` w `images.tsx`; usunąć nawigację do tras `text-regions`/`scenes/[sceneId]` w tym przepływie.
4. Rozszerzyć `images.tsx`: dynamiczny tytuł, footer galeria/aparat, pasek licznika + przełączniki, maszyna faz submitu i orkiestracja OCR→korekta→TTS→playlist→szczegóły.
5. Zdjąć trasy „Sceny OCR" / „Głos lektora" / `text-regions` z `_layout.tsx` dla tego przepływu (zgodnie z REMOVED w specach); zweryfikować brak osieroconych `router.push`.
6. Weryfikacja: `npm run test:mobile`, `npm run test:api`, `npm run lint`, `npm run format:check`, `npm run build:api`.

**Rollback:** zmiany są w większości w `apps/mobile` (UI + orkiestracja klienta) plus konfiguracja zależności; rewert commitów przywraca poprzedni przepływ wieloekranowy. Brak migracji danych (D2/D5) → brak rollbacku schematu DB.

## Open Questions

- Czy `generate-audio` na pewno przetwarza wyłącznie sceny `ready_for_audio` i pomija `audio_done`? (Determinuje „TTS tylko na zmienionym tekście" bez zmian API — D2.) Potwierdzić w `routes/audio.ts` przed implementacją; jeśli nie, dodać warunek po stronie API zachowując kontrakt.
- Czy istnieje stabilne mapowanie `PageImage → Scene` po stronie klienta dla wyliczenia ikon statusu, czy trzeba je dołożyć do odpowiedzi `getScenes`/`getImages` (`pageImageId` na scenie)? (D5.)
- Czy `react-native-draggable-flatlist` jest zgodny z Expo SDK 54 i web; jeśli nie — który fallback/biblioteka. (D4.)
- Czy submit ma czyścić/odbudowywać playlistę za każdym razem, czy tylko gdy zmienił się zbiór scen/audio? (Wpływ na `buildPlaylist` w fazie `done`.)
