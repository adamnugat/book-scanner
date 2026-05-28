## Why

Ekran edycji audiobooka (`/(app)/projects/[id]/images`) ma już akcje "Obszary" i "Korekta OCR" w pasku akcji, ale nadal nie pozwala edytować lektora ani wstawki muzycznej bez przechodzenia na osobny ekran `voice.tsx`. Poprzednia iteracja ukryła kafelek "Głos i audio" w sekcji narzędzi z założeniem, że te funkcje zostaną wbudowane w widok edycji audiobooka. Trzeba teraz dodać tę integrację, aby twórca audiobooka mógł zmienić głos lub wstawkę i ponownie wygenerować audio w jednym widoku, spójnie z istniejącym wzorcem OCR (toggle/modal + submit footer).

## What Changes

- Dodanie trzeciego przycisku **"Audio"** w pasku akcji na ekranie edycji audiobooka, obok "Obszary" i "Korekta OCR".
- Tap w przycisk "Audio" otwiera menu (modal/sheet) z dwoma sekcjami: **"Edycja lektora"** i **"Edycja wstawki"**.
- Sekcja **"Edycja lektora"**:
  - Lista głosów pobierana z `GET /voices?language=<projectLanguage>` (jak na `voice.tsx`).
  - Po wybraniu nowego głosu i zapisaniu (`PUT /projects/:id` z `voiceId`):
    - Backend usuwa wszystkie pliki audio dla wszystkich scen projektu (`AudioTrack` rows + obiekty w storage).
    - Wszystkie sceny resetują status audio (`audio_done|audio_error|audio_generating → ready_for_audio`), aby proces audio dla każdego zdjęcia był oznaczony jako "niewykonany".
    - Mobile odświeża listę scen/zdjęć; karty `PageImageCard` przestają pokazywać `hasAudio`.
    - Footer "Wyślij i przetwórz" staje się aktywny; kliknięcie uruchamia istniejący `handleSubmit`, który po wykryciu braku audio zawoła `processOcrBatch` (skip jeśli OCR done) + `generateAudio` dla wszystkich gotowych scen.
- Sekcja **"Edycja wstawki"**:
  - Lista pobierana z `GET /interstitial-presets`.
  - Po wybraniu wstawki i zapisaniu (`PUT /projects/:id` z `interstitialPreset`):
    - **Nie** usuwamy plików audio scen ani nie zmieniamy statusów scen.
    - Footer staje się aktywny w trybie "tylko playlist rebuild"; kliknięcie wywołuje wyłącznie `POST /projects/:id/build-playlist`, który podmienia wstawkę w playliście odtwarzacza.
- Footer "Wyślij i przetwórz" otrzymuje nowy stan `orderDirty`-podobny (`audioDirty` / `interstitialDirty`), aby reagował na zmiany audio bez wymuszania pełnej re-procesji OCR.
- Przycisk pierwotny "Audio" pokazuje wskaźnik (np. kropkę) gdy są niezapisane zmiany audio/wstawki.

**Non-goals:**
- Brak zmian w endpointach billing, sharing, auth ani storage konfiguracji.
- Brak zmian dostawców TTS/OCR ani schematów ElevenLabs/Google Cloud Vision.
- Nie usuwamy ekranu `voice.tsx` ani trasy `/(app)/projects/[id]/voice` (będzie wyciszony, jak po poprzedniej iteracji).
- Nie dodajemy nowego mechanizmu odtwarzania próbek głosu — preview odtwarzamy w menu identycznie jak na `voice.tsx`.
- Nie zmieniamy modelu Prisma (kolumny `voiceId`, `interstitialPreset` już istnieją na `Project`).

## Capabilities

### New Capabilities
- `audiobook-audio-editing-menu`: menu "Audio" wbudowane w pasek akcji ekranu edycji audiobooka, z sekcjami "Edycja lektora" oraz "Edycja wstawki" i regułami przełączania stanu submita.

### Modified Capabilities
- `text-to-speech-generation`: doprecyzowanie, że zmiana `voiceId` projektu MUSI inwalidować i usunąć wszystkie istniejące `AudioTrack` rekordy + obiekty storage oraz zresetować status audio scen do `ready_for_audio`.
- `inline-audio-player`: doprecyzowanie, że zmiana `interstitialPreset` projektu jest stosowana wyłącznie przez przebudowę playlisty (`build-playlist`), bez ruszania wygenerowanego audio scen.

## Impact

- `apps/mobile/app/(app)/projects/[id]/images.tsx` — nowy przycisk "Audio" w pasku akcji, modal z dwiema sekcjami, integracja z `handleSubmit` (rozszerzenie o ścieżkę "tylko playlist rebuild").
- `apps/mobile/components/` — nowy komponent `AudioEditingMenu.tsx` (modal) lub rozbudowa istniejącego wzorca modali OCR.
- `apps/mobile/lib/api.ts` — bez zmian (wszystkie wymagane endpointy istnieją: `updateProject`, `getVoices`, `getInterstitialPresets`, `generateAudio`, `buildPlaylist`).
- `apps/api/src/routes/projects.ts` — `PUT /projects/:id` rozszerzony tak, by przy zmianie `voiceId` usuwał `AudioTrack` (rekordy + storage) i resetował status scen audio.
- `packages/shared/src/types.ts` — bez zmian (`voiceId`, `interstitialPreset` już są na `UpdateProjectRequest` i `ProjectResponse`).
- Testy: `apps/mobile/__tests__/project-images.test.tsx` (nowe testy menu + submit), nowy test backendowy w `apps/api/src/__tests__` na inwalidację audio przy zmianie głosu.
- Weryfikacja: `npm run test:mobile`, `npm run test:api`, `npm run lint`.
