## Context

Ekran edycji audiobooka (`apps/mobile/app/(app)/projects/[id]/images.tsx`) jest dziś centralnym widokiem MVP. Posiada:

- Pasek `settingsBar` z dwoma `Pressable` togglami: "Obszary" (`areaSelectionEnabled`) i "Korekta OCR" (`ocrCorrectionEnabled`).
- Footer `AudioFlowFooterMenu` z akcją "Wyślij i przetwórz" (`handleSubmit`), wywoływany gdy są nieprzeprocesowane zdjęcia lub porządek się zmienił (`orderDirty`).
- Submit pipeline: upload → `processOcrBatch` → opcjonalny stop dla korekty → `generateAudio` → `buildPlaylist`.

Funkcje "Edycja lektora" i "Edycja wstawki" są obecnie dostępne wyłącznie na `voice.tsx`. Kafelek nawigacji do `voice.tsx` jest już ukryty po iteracji `2026-05-28-rename-project-tools-and-hide-voice-audio`, ale jego logika selekcji głosu (`api.updateProject({ voiceId })`, `api.getVoices(language)`) oraz konsumpcja `api.getInterstitialPresets()` pozostaje sprawdzona i gotowa do reużycia.

Backend już udostępnia wszystkie potrzebne endpointy:
- `GET /voices?language=...` → `VoiceResponse[]`
- `GET /interstitial-presets` → `InterstitialPresetResponse[]`
- `PUT /projects/:id` → przyjmuje `voiceId` i `interstitialPreset` (`apps/api/src/routes/projects.ts` L137–163)
- `POST /projects/:id/generate-audio` → TTS dla `ready_for_audio`
- `POST /projects/:id/build-playlist` → przebudowa playlisty z aktualnym `interstitialPreset`
- Audio storage: scena reset (`scenes.ts` L313–349) już zawiera wzorzec usuwania `AudioTrack` + `deleteFile`.

Stakeholderzy: właściciel projektu (twórca audiobooka). UX: spójność z istniejącymi togglami "Obszary"/"Korekta OCR" oraz przyciskiem submit.

## Goals / Non-Goals

**Goals:**
- Przycisk "Audio" w `settingsBar` ekranu edycji audiobooka, otwierający menu modalne z dwiema sekcjami.
- Spójna integracja stanu menu z istniejącym footerem submit (jeden punkt akcji "Wyślij i przetwórz").
- Zmiana lektora MUSI inwalidować całe wygenerowane audio projektu (DB + storage), zaznaczając audio jako "do ponownego wykonania".
- Zmiana wstawki MUSI tylko przebudować playlistę — bez naruszania `AudioTrack` scen.
- Brak nowych shared types i Prisma migracji.

**Non-Goals:**
- Nie usuwamy `voice.tsx` ani jego trasy.
- Nie zmieniamy modelu Prisma ani schema migracji.
- Nie zmieniamy dostawcy TTS/OCR ani logiki ElevenLabs sync.
- Nie ruszamy offline cache invalidation strategy — invalidacja audio po zmianie głosu obejmuje serwer; klient pobierze nowe `audioTrackId` przy następnym wywołaniu `getAudioTracks` (stary cache wygaśnie naturalnie, lub można dodać czyszczenie w follow-up).
- Brak nowych autoryzacji — operacje wymagają już istniejącego `requireAuth` + ownership middleware na `/projects/:id`.

## Decisions

### D1. Lokalizacja przycisku "Audio" w pasku akcji

Dodajemy trzeci `Pressable` w `styles.toggles` obok "Obszary" i "Korekta OCR". Inaczej niż tamte (toggle on/off), "Audio" jest akcją otwierającą modal: `accessibilityRole="button"`, ikona `Feather name="mic"` lub `music`, label "Audio".

**Alternatywa odrzucona:** osobny przycisk w footerze. Odrzucone — łamałoby istniejący pattern "settings vs. submit" i wymagałoby trzeciego slotu w `AudioFlowFooterMenu`.

### D2. Komponent menu — `AudioEditingMenu`

Nowy plik `apps/mobile/components/AudioEditingMenu.tsx` — `Modal` (`animationType="slide"`) z dwiema scrollowalnymi sekcjami:
1. **"Edycja lektora"** — `PickerCard` lista głosów (jak `voice.tsx` L288–311) + opcjonalny preview.
2. **"Edycja wstawki"** — `PickerCard` lista presetów ze sklepu `getInterstitialPresets()` + opcja "Brak wstawki" (`null`).

Stopka modala: dwa przyciski — "Anuluj" i "Zapisz". "Zapisz" wywołuje callback z `{ voiceId?, interstitialPreset? }` dla zmienionych pól.

**Alternatywa odrzucona:** dwa osobne modali z osobnymi przyciskami otwierającymi. Odrzucone — wymaga dodatkowych ikon i komplikuje pasek; jeden modal z dwiema sekcjami jest bardziej zgodny z prompt (jedno "Audio" z dwiema sekcjami).

### D3. Reużycie endpointów — bez nowych route'ów

Operacje opierają się o istniejące endpointy:
- `api.getVoices(language)` — lista głosów dla języka projektu.
- `api.getInterstitialPresets()` — lista wstawek.
- `api.updateProject(id, { voiceId })` — zapis nowego lektora.
- `api.updateProject(id, { interstitialPreset })` — zapis nowej wstawki.

Aby nie wymagać dodatkowych żądań, w `images.tsx` przy mount pobieramy `project.voiceId`, `project.interstitialPreset`, `project.language` (przez `api.getProject(id)`, już dziś jest w `loadAll`).

**Alternatywa odrzucona:** nowe route'y typu `POST /projects/:id/change-voice`. Odrzucone — duplikacja logiki, `PUT /projects/:id` już to obsługuje.

### D4. Inwalidacja audio przy zmianie `voiceId` — strona serwera

`apps/api/src/routes/projects.ts` w `PUT /projects/:id` wykrywa zmianę `voiceId`:
- Jeśli `voiceId` (w body) ≠ `project.voiceId` (z DB) i nie jest `undefined`:
  - Pobierz wszystkie `AudioTrack` dla scen tego projektu.
  - Dla każdego — `deleteFile(track.storagePath)` z `try/catch + warn` (jak w `scenes.ts` L313).
  - `prisma.audioTrack.deleteMany({ where: { scene: { projectId } } })`.
  - `prisma.scene.updateMany({ where: { projectId, status: { in: ['audio_done','audio_error','audio_generating'] } }, data: { status: 'ready_for_audio' } })`.
  - `prisma.playlistItem.deleteMany({ where: { projectId } })` — playlist nieaktualny, zostanie odbudowany przy `generateAudio` + `buildPlaylist`.
- W odpowiedzi zwracamy zaktualizowany `ProjectResponse` (jak dziś).

**Alternatywa odrzucona:** robić to po stronie klienta przez serię wywołań DELETE. Odrzucone — race conditions, dodatkowa logika autoryzacji, łatwe do pominięcia.

**Trade-off:** transakcyjność. Owijamy DB operacje w `prisma.$transaction([...])`. `deleteFile` (storage) idzie poza transakcją z `Promise.allSettled` — błąd storage nie blokuje zmiany lektora; pozostałe sieroce pliki są nieszkodliwe (osobne klucze).

### D5. Tryb "tylko wstawka" w submit

Dziś `handleSubmit` (`images.tsx` L235–286) zawsze próbuje OCR + TTS + playlist. Po zmianie wstawki nie chcemy uruchamiać OCR/TTS. Rozszerzenie:

- Nowe `useState`: `interstitialDirty: boolean` (true gdy modal "Zapisz" dla wstawki).
- W `handleSubmit`:
  - Jeśli `interstitialDirty && !hasProcessableWork && !orderDirty`, wywołaj **tylko** `api.buildPlaylist(id)` i wyczyść flag.
  - W przeciwnym razie — istniejący flow.
- `createDisabled` w footerze rozszerzyć: `submitPhase !== 'idle' || (!hasProcessableWork && !orderDirty && !interstitialDirty)`.

**Alternatywa odrzucona:** automatyczny `buildPlaylist` w `updateProject`. Odrzucone — łamie UX wzorzec "zmiany lokalne → submit", a `buildPlaylist` jest droższy.

### D6. Tryb "zmiana głosu" w submit

Po zmianie głosu serwer już zresetował sceny do `ready_for_audio`. Klient:
- Odświeża `loadAll` (jak po `handleSaveCorrection`) — `getImages`, `getScenes`, `getAudioTracks`.
- `hasProcessableWork` derived z scen — naturalnie staje się `true`, footer aktywny.
- `handleSubmit` idzie standardową ścieżką: pomija OCR (sceny mają `ocr_done`/`ready_for_audio`), przechodzi do `generateAudio`.

**Trade-off:** wymaga, aby backend był odporny na powtórne wywołanie `generateAudio` (już jest — `audio_generating` blokuje dwukrotne uruchomienie).

### D7. Stan zapisany lokalnie vs. natychmiastowy PUT

Wybór wewnątrz modala (klik na `PickerCard`) NIE zapisuje od razu. Dopiero "Zapisz" wywołuje `updateProject`. Pozwala to anulować zmiany.

**Trade-off vs. voice.tsx:** istniejący `voice.tsx` zapisuje natychmiast (L77–88). To zachowanie różni się celowo — modal jest transakcyjny.

### D8. Wskaźnik niezapisanych zmian audio

Przycisk "Audio" pokazuje wskaźnik (mała kropka) gdy `interstitialDirty` lub po zmianie głosu z niewygenerowanym audio (`scenes.some(s => s.status === 'ready_for_audio')`). To wizualne przypomnienie, że trzeba kliknąć "Wyślij i przetwórz".

## Risks / Trade-offs

[Risk] Usunięcie wszystkich `AudioTrack` przy zmianie głosu spowoduje natychmiastowy "blackout" odtwarzania, jeśli użytkownik miał włączony player → Mitigation: invalidate `useAudioPlayer` cache (re-load playlist) po `loadAll`. Refresh `getAudioTracks` zwróci pustą listę, hook się dostosuje. Dodatkowo, dla offline cache klient zachowa stare pliki, ale `playlist` z serwera już nie będzie na nie wskazywał — naturalna ścieżka cleanup w follow-up.

[Risk] Race condition: użytkownik zmienia głos, w trakcie sceny były `audio_generating` → Mitigation: backend resetuje również `audio_generating` do `ready_for_audio`; pojedyncze pliki tworzone przez worker zakończą się, ale ich `AudioTrack` writes nie znajdą sceny i zwrócą warn (jak istniejący wzorzec).

[Risk] Nowy modal może uderzyć w UX SafeArea/keyboard na iOS → Mitigation: użyj `Modal animationType="slide" + KeyboardAvoidingView`, jak `OcrCorrectionModal.tsx`.

[Risk] `buildPlaylist` po zmianie wstawki, gdy projekt nie ma jeszcze wygenerowanego audio → Mitigation: `buildPlaylist` jest no-op-friendly (zwraca itemCount 0); brak negatywnego efektu, ale można zablokować akcję w UI jeśli `audioTracks.length === 0`.

[Risk] Backwards compat dla persisted `voiceId` w `updateProject` — istniejące integracje (np. `voice.tsx`) wywołują `updateProject({ voiceId })` bez intencji invalidacji → Mitigation: invalidacja działa zawsze gdy `voiceId` się zmienia, ale `voice.tsx` po iteracji jest ukryty z UI. Test zachowania: jeśli `voiceId` w body === aktualnemu `project.voiceId`, **nie** wykonuj invalidacji.

## Migration Plan

1. Backend: dodać invalidację w `PUT /projects/:id` (gated na zmianie `voiceId`). Brak migracji DB. Brak deploy ryzyka — operacja additive.
2. Mobile: dodać przycisk + modal w `images.tsx`, integracja submit. Brak zmian w shared types.
3. Test: `npm run test:api` (nowy test invalidacji audio), `npm run test:mobile` (nowy test menu + submit).
4. Rollback: rewertuj zmiany w `projects.ts` i `images.tsx`. Brak migracji do cofania.

## Open Questions

- Czy "Audio" przycisk powinien dziedziczyć stan disabled gdy projekt jest świeży (brak scen)? Decyzja roboczza: pokazuj zawsze; w modalu pokaż empty state dla głosów/wstawek jeśli brak danych.
- Czy preview głosu (▶) w nowym menu jest wymagany? Decyzja roboczza: tak — kopiujemy z `voice.tsx` dla parytetu, ale można zaplanować jako stretch goal.
