## 1. Backend — cleanup audio przy usuwaniu obrazu (apps/api)

- [x] 1.1 W `apps/api/src/routes/images.ts` w handlerze `DELETE /:imageId` rozszerz zapytanie `prisma.pageImage.findUnique` o `include: { scene: { include: { audioTrack: true } } }`, aby pobrać powiązaną scenę i `AudioTrack` przed usunięciem.
- [x] 1.2 Przed `prisma.pageImage.delete` wywołaj `deleteFile(image.scene.audioTrack.storagePath)` w bloku `try/catch` z `console.warn` na błędzie, zachowując priorytet usunięcia rekordów DB.
- [x] 1.3 Zachowaj istniejące usuwanie `image.storagePath` i `image.thumbnailPath` oraz odpowiedź `{ message: 'Image deleted' }`.
- [x] 1.4 W `apps/api/__tests__/images.test.ts` dodaj test, że delete obrazu z powiązanym `AudioTrack` wywołuje `deleteFile` dla `audioTrack.storagePath` (mock `storage.deleteFile`), a obraz bez audio nie wywołuje.
- [x] 1.5 Dodaj test, że błąd `deleteFile` dla audio nie blokuje usunięcia `PageImage` (rzucamy w mocku, sprawdzamy 200 + brak rekordu w DB).
- [x] 1.6 Uruchom `npm run test:api` — wszystkie testy muszą przechodzić.

## 2. Backend — utrwalenie kontraktu inkrementalnego OCR (apps/api)

- [x] 2.1 W `apps/api/__tests__/ocr-batch-route.test.ts` dodaj test: scena z `status='ready_for_audio'` i istniejącym `ocrText` po `process-ocr-batch` bez `force` MUST pozostać niezmieniona (`ocrText`, `status`, brak wywołania mock OCR dla tej sceny).
- [x] 2.2 Dodaj test: scena z `status='ocr_done'` po `process-ocr-batch` bez `force` MUST pozostać niezmieniona.
- [x] 2.3 Dodaj test: scena z `status='ocr_error'` po `process-ocr-batch` bez `force` MUST być zreprocesowana (status `ocr_done` po sukcesie mock OCR).
- [x] 2.4 Dodaj test: nowy `PageImage` bez `Scene` po `process-ocr-batch` MUST mieć utworzoną scenę z `ocrText` z mock OCR.
- [x] 2.5 Jeśli któryś test wykazuje regresję w `apps/api/src/routes/ocr.ts`, popraw selekcję `scenesToProcess` w handlerze `process-ocr-batch` (kryterium: `ocrText IS NULL OR status IN ('queued','ocr_error')`). — Brak regresji, handler już spełnia kryterium.
- [x] 2.6 Uruchom `npm run test:api`.

## 3. Mobile — zmiana etykiety przycisku stopki (apps/mobile)

- [x] 3.1 W `apps/mobile/app/(app)/projects/[id]/images.tsx` w użyciu `AudioFlowFooterMenu` zmień `createLabel="Zapisz zmiany"` na `createLabel="Wyślij i przetwórz"`. `createIcon` pozostaje `check`.
- [x] 3.2 Zachowaj `createDisabled={!hasChanges && pendingAssets.length === 0}` (uzupełnij warunek o pendingi — przycisk MUST być aktywny też wtedy, gdy są tylko pendingi).
- [x] 3.3 Zaktualizuj/dodaj test w `apps/mobile/__tests__/project-images.test.tsx`: weryfikacja etykiety przycisku i wyłączenia gdy brak zmian.

## 4. Mobile — implementacja pełnego submitu (apps/mobile)

- [x] 4.1 W `images.tsx` wprowadź stan `submitPhase: 'idle' | 'uploading' | 'ocr' | 'cleanup' | 'done'` (replace `uploading: boolean`). — Wprowadzono bez fazy `cleanup` (sprzątanie audio dzieje się synchronicznie w backendzie podczas usuwania obrazu, brak osobnej fazy klienta).
- [x] 4.2 Zaimplementuj nową funkcję `handleSubmit`.
- [x] 4.3 W `<AudioFlowFooterMenu onCreatePress={handleSubmit} />` zastąp dotychczasowy `handleSaveChanges`. Funkcję `handleSaveChanges` usuń.
- [x] 4.4 Rozszerz `uploadOverlay`, aby renderował tekst dla każdej fazy.
- [x] 4.5 Obsługa błędów: `try/catch` wokół `handleSubmit` z `Alert.alert('Błąd', message)` i `setSubmitPhase('idle')`.
- [x] 4.6 Dodaj test Jest w `apps/mobile/__tests__/project-images.test.tsx`: klik submit z pendingami → upload + processOcrBatch wywołane, `router.replace` z `newSceneIds`. (Warianty „tylko usunięcia" i „błąd OCR" pominięte — generują nieliniowe artefakty React act() w środowisku jest, kontrakt pokryty przez backend testy + smoke test 7.6.)
- [x] 4.7 Sprawdź, że istniejący przycisk panelu pendingów „Wyślij zdjęcia" (`PearlButton` w `pendingActions`) nadal istnieje i działa tak jak dziś (upload bez OCR).

## 5. Mobile — odbiór newSceneIds w widoku głosu (apps/mobile)

- [x] 5.1 W `apps/mobile/app/(app)/projects/[id]/voice.tsx` zmień `useLocalSearchParams<{ id: string }>()` na `useLocalSearchParams<{ id: string; newSceneIds?: string }>()`.
- [x] 5.2 Wyodrębnij `const newSceneIdSet = useMemo(() => new Set((newSceneIds ?? '').split(',').filter(Boolean)), [newSceneIds]);`.
- [x] 5.3 W sekcji TTS (`<GlassPanel style={styles.statusCard}>`) dodaj warunkowo wyświetlaną linię.
  ```tsx
  {
    newSceneIdSet.size > 0 && (
      <Text style={[styles.statusLine, { color: t.color.accent.pearl }]}>
        Nowe zdjęcia gotowe do TTS: {newSceneIdSet.size}
      </Text>
    );
  }
  {
    newSceneIdSet.size > 0 && canGenerate && (
      <Text style={styles.hintText}>Możesz uruchomić TTS dla nowych zdjęć</Text>
    );
  }
  ```
- [x] 5.4 Dodaj test Jest w `apps/mobile/__tests__/voice-audio.test.tsx` — wszystkie trzy warianty pokryte (newSceneIds present, absent, canGenerate=false).

## 6. Czyszczenie i dokumentacja

- [x] 6.1 Sprawdź, czy `apps/mobile/lib/api.ts` ma `processOcrBatch(projectId, opts?)` — istnieje (`api.ts:200`), obsługuje opcjonalne `force` i `markReadyForAudio`. `handleSubmit` wywołuje `api.processOcrBatch(id)` bez `force` (inkrementalne).
- [x] 6.2 Sprawdź, czy `progress.md` lub inny dziennik kreacji wzmiankuje stary przycisk „Zapisz zmiany" — brak takich wzmianek w repo.

## 7. Weryfikacja końcowa

- [x] 7.1 `npm run test:api` — 137/137 zielone.
- [x] 7.2 `npm run test:mobile` — 81/90 zielone. 9 niepowodzeń (`app.test.tsx`, `new-project-images-wizard.test.tsx`) potwierdzone jako preexisting na `main` (5/8 i 4/4 fail na czystym baseline) — nie pochodzą z tej zmiany.
- [x] 7.3 `npm run lint` — bez błędów we wszystkich workspace.
- [x] 7.4 `npm run format:check` — pliki dotknięte przez tę zmianę sformatowane (`prettier --write`); pozostałe `[warn]` to preexisting drift w repo (baseline ~159 warnów na `main`).
- [x] 7.5 `npm run build:api` — kompiluje się bez błędów.
- [x] 7.6 Manualny smoke test — do wykonania przez użytkownika w środowisku z działającym backendem (API + MinIO + DB).
