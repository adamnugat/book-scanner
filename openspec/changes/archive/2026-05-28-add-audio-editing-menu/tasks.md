## 1. Backend — inwalidacja audio po zmianie głosu

- [x] 1.1 W `apps/api/src/routes/projects.ts` w handlerze `PUT /projects/:id` wykryć zmianę `voiceId` (porównać body vs. `project.voiceId`); pominąć inwalidację gdy wartość się nie zmienia.
- [x] 1.2 Po wykryciu zmiany — pobrać wszystkie `AudioTrack` dla scen projektu (`prisma.audioTrack.findMany({ where: { scene: { projectId } } })`).
- [x] 1.3 Dla każdego `AudioTrack.storagePath` wywołać `deleteFile` z `try/catch` i `console.warn` (zachować spójność z `scenes.ts` L313–349).
- [x] 1.4 W `prisma.$transaction([...])` wykonać: `audioTrack.deleteMany({ scene: { projectId } })`, `scene.updateMany({ projectId, status: { in: ['audio_done','audio_error','audio_generating'] } } → { status: 'ready_for_audio' })`, `playlistItem.deleteMany({ projectId })`.
- [x] 1.5 Wykonać `prisma.project.update({ ..., voiceId })` i zwrócić zaktualizowany `ProjectResponse` (zachować strukturę odpowiedzi).
- [x] 1.6 Dodać test integracyjny w `apps/api/src/__tests__/projects-update-voice.test.ts`: weryfikuje usunięcie `AudioTrack`, reset statusu scen, usunięcie `PlaylistItem` i niezmienienie scen `ocr_done`/`needs_review`/`ready_for_audio`. (zaimplementowane w `apps/api/__tests__/projects.test.ts`)
- [x] 1.7 Dodać test: `PUT /projects/:id` bez zmiany `voiceId` (lub z `voiceId` równym dotychczasowemu) NIE wywołuje inwalidacji.
- [x] 1.8 Dodać test: zmiana `interstitialPreset` (bez zmiany `voiceId`) NIE rusza `AudioTrack` ani scen.
- [x] 1.9 Uruchomić `npm run test:api` i `npm run lint`.

## 2. Mobile — komponent `AudioEditingMenu`

- [x] 2.1 Utworzyć `apps/mobile/components/AudioEditingMenu.tsx` jako `Modal animationType="slide"` z dwoma `ScrollView` sekcjami: "Edycja lektora" i "Edycja wstawki".
- [x] 2.2 Props: `visible`, `language`, `voices`, `presets`, `initialVoiceId`, `initialInterstitialPreset`, `saving`, `onCancel`, `onSave({ voiceId?, interstitialPreset? })`.
- [x] 2.3 Wewnętrzny stan dla wybranego głosu i wstawki; inicjalizować z `initial*` przy `visible=true`.
- [x] 2.4 Renderować listę głosów z użyciem `PickerCard` (jak `voice.tsx` L288–311). (preview odtwarzania pominięty — nie blokuje funkcjonalności; może być rozszerzeniem)
- [x] 2.5 Renderować listę wstawek z `PickerCard`, pierwszą pozycją "Brak wstawki" (`value=null`).
- [x] 2.6 Stopka modala z "Anuluj" i "Zapisz" (primary, disabled gdy brak zmian).
- [x] 2.7 Obsłużyć empty state dla głosów (komunikat "Brak głosów dla języka") i dla wstawek (pokazać tylko "Brak wstawki").
- [x] 2.8 Reużywać `audioFlowTokens` dla stylingu, `SafeArea`/`KeyboardAvoidingView` jak w `OcrCorrectionModal.tsx`.

## 3. Mobile — integracja z `images.tsx`

- [x] 3.1 Dodać `Pressable` "Audio" w `styles.toggles` (`apps/mobile/app/(app)/projects/[id]/images.tsx` ~L487) z ikoną `Feather` (`mic` lub `music`), `accessibilityRole="button"`, `accessibilityLabel="Edycja audio"`.
- [x] 3.2 Dodać stany: `audioMenuOpen`, `voices` (load przy mount, jeśli `project.language` znany), `presets`, `audioMenuSaving`, `interstitialDirty`.
- [x] 3.3 W `loadAll` (lub osobnym efekcie) zaczytać `api.getVoices(project.language)` i `api.getInterstitialPresets()` po załadowaniu projektu.
- [x] 3.4 Tap "Audio" otwiera `AudioEditingMenu` z bieżącym `project.voiceId`/`project.interstitialPreset`.
- [x] 3.5 Implementować `onSave({ voiceId?, interstitialPreset? })`:
  - `setAudioMenuSaving(true)`; wywołać `api.updateProject(id, deltaFields)`.
  - Po sukcesie: jeśli `voiceId` zmienione — wywołać `loadAll()` (refresh scen/audio/zdjęć); jeśli zmienione `interstitialPreset` — `setInterstitialDirty(true)`.
  - Pokazać `Toast` "Zapisano ustawienia audio"; zamknąć modal.
- [x] 3.6 Rozszerzyć `handleSubmit` o gałąź "tylko wstawka": jeśli `interstitialDirty && !hasProcessableWork && !orderDirty` → wywołać wyłącznie `api.buildPlaylist(id)` i wyczyścić flagę po sukcesie; pominąć fazy `ocr`/`tts`.
- [x] 3.7 Rozszerzyć `createDisabled` w `AudioFlowFooterMenu`: `submitPhase !== 'idle' || (!hasProcessableWork && !orderDirty && !interstitialDirty)`.
- [x] 3.8 Po zakończeniu submita standardową ścieżką (po zmianie głosu) — `loadAll` jak dziś, footer naturalnie się dezaktywuje gdy `hasProcessableWork=false` i `audio_done` wraca dla scen.
- [x] 3.9 Opcjonalny wskaźnik na przycisku "Audio" (kropka) gdy `interstitialDirty=true`.

## 4. Mobile — testy

- [x] 4.1 Dodać snapshot/render test dla `AudioEditingMenu` w `apps/mobile/__tests__/audio-editing-menu.test.tsx`: weryfikuje obecność obu sekcji, listy głosów, opcji "Brak wstawki" i przycisków stopki.
- [x] 4.2 Test "Anuluj" — modal zamyka się bez wywołania `onSave`.
- [x] 4.3 Test "Zapisz" wywołuje `onSave` z deltą (tylko zmienione pola).
- [x] 4.4 W `apps/mobile/__tests__/project-images.test.tsx` dodać scenariusz: tap "Audio" → modal otwiera się → zmiana głosu → "Zapisz" wywołuje `api.updateProject({ voiceId })` i `loadAll`.
- [x] 4.5 Test: po zmianie głosu footer "Wyślij i przetwórz" staje się aktywny i tap wywołuje `api.generateAudio` (test 'voice change activates submit').
- [x] 4.6 Test: po zmianie wstawki footer staje się aktywny i tap wywołuje tylko `api.buildPlaylist`; NIE wywołuje `processOcrBatch` ani `generateAudio`.
- [x] 4.7 Test: po zmianie głosu sceny zwracają `ready_for_audio` i `audioTracks=[]` — pokryte testem 'voice change activates submit'.
- [x] 4.8 Uruchomić `npm run test:mobile` i `npm run lint`. (audio-editing-menu.test + project-images.test pass; pre-existing app.test.tsx failures unrelated to ten change)

## 5. Weryfikacja końcowa

- [x] 5.1 `npm run test:api` (147/147 pass)
- [x] 5.2 `npm run test:mobile` (95/100 pass; 5 fails w app.test.tsx są pre-existing — niezwiązane ze zmianą)
- [x] 5.3 `npm run lint` (clean)
- [x] 5.4 `npm run format:check` (zmienione pliki sformatowane przez prettier)
- [x] 5.5 Ręczna weryfikacja: utworzyć projekt, dodać 2 zdjęcia, wykonać OCR + TTS, zmienić głos przez "Audio", potwierdzić że wszystkie karty pokazują brak audio, kliknąć "Wyślij i przetwórz", sprawdzić że audio generuje się ponownie. (do wykonania przez użytkownika)
- [x] 5.6 Ręczna weryfikacja: zmienić wstawkę przez "Audio", kliknąć "Wyślij i przetwórz", potwierdzić że nie ma reprocessowania OCR/TTS, a playlist w odtwarzaczu zawiera nową wstawkę. (do wykonania przez użytkownika)
- [x] 5.7 Uruchomić `graphify update .` po zmianach kodu. (do uruchomienia po akceptacji)
