## 1. Hook `useAudioPlayer`

- [x] 1.1 Utwórz `apps/mobile/lib/use-audio-player.ts` — wyekstrahuj całą logikę audio z `player.tsx`: ładowanie playlist (z jingle'ami i offline cache), `Audio.Sound`, stan `currentIndex`, `isPlaying`, `positionMs`, `durationMs`, `loading`
- [x] 1.2 Zaimplementuj i wyeksportuj funkcje: `handlePlayPause`, `goToSceneIndex(direction: -1|1)`, `seekBy(deltaMs: number)`, `loadAndPlay(index: number)`, `jumpToScene(sceneOrderIndex: number)`
- [x] 1.3 Upewnij się, że `useEffect` cleanup wywołuje `sound.unloadAsync()` przy odmontowaniu komponentu

## 2. Rozszerzenie `AudioFlowPlayerPanel`

- [x] 2.1 Dodaj opcjonalne propsy do `AudioFlowPlayerPanel` w `apps/mobile/components/audioflow.tsx`: `isPlaying?: boolean`, `onSkipBack?: () => void`, `onSkipForward?: () => void`
- [x] 2.2 Zmień ikonę przycisku play na dynamiczną: `isPlaying ? '⏸' : '▶'`
- [x] 2.3 Dodaj dwa przyciski skip (−10 s, +10 s) po obu stronach kontrolek nawigacji — widoczne tylko gdy `onSkipBack`/`onSkipForward` są przekazane

## 3. Integracja w ekranie szczegółów projektu

- [x] 3.1 W `apps/mobile/app/(app)/projects/[id]/index.tsx` wywołaj `useAudioPlayer(id)` i przekaż wartości do `AudioFlowPlayerPanel` (`progress`, `currentTime`, `totalTime`, `isPlaying`, `onPlayPress`, `onPreviousPress`, `onNextPress`, `onSkipBack`, `onSkipForward`)
- [x] 3.2 Usuń `handleOpenPlayer` jako handler dla przycisków panelu (play/prev/next) — teraz obsługuje je hook
- [x] 3.3 Dodaj przycisk „Zaawansowany odtwarzacz" pod `AudioFlowPlayerPanel`, nawigujący do `/(app)/projects/${id}/player`
- [x] 3.4 Wyłącz przycisk play i skip gdy `audioTracks.length === 0` (brak wygenerowanego audio)

## 4. Refaktor ekranu pełnego odtwarzacza

- [x] 4.1 W `apps/mobile/app/(app)/projects/[id]/player.tsx` zastąp lokalny stan audio wywołaniem `useAudioPlayer(id)` — usuń zduplikowany stan i logikę
- [x] 4.2 Zweryfikuj, że funkcjonalność offline cache, pobierania i usuwania cache nadal działa poprawnie po refaktorze

## 5. Weryfikacja

- [x] 5.1 Uruchom `npm run lint` i napraw ewentualne błędy TypeScript/ESLint
- [x] 5.2 Uruchom `npm run test:mobile` — sprawdź brak regresji
- [ ] 5.3 Manualnie przetestuj: play/pause inline, skip ±10 s, nawigacja prev/next scena, przycisk „Zaawansowany odtwarzacz", pełny ekran odtwarzacza po refaktorze
