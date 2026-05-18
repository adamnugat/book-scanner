## Why

Na ekranie szczegółów projektu `AudioFlowPlayerPanel` pełni rolę wyłącznie przycisku nawigującego do pełnego odtwarzacza — użytkownik nie może odtworzyć audiobooka bez opuszczenia widoku projektu. Zmiana ta wprowadza prawdziwy odtwarzacz inline, dzięki czemu odtwarzanie jest dostępne bezpośrednio z ekranu szczegółów.

## What Changes

- `AudioFlowPlayerPanel` w ekranie szczegółów projektu staje się funkcjonalnym odtwarzaczem audio (play/pause, nawigacja po stronach, przewijanie ±10 s, pasek postępu z dokładnym czasem).
- Logika audio (zarządzanie `Audio.Sound`, stan playlist, pozycja, czas trwania) zostaje wyekstrahowana do reużywalnego hooka `useAudioPlayer`, współdzielonego przez ekran szczegółów i ekran pełnego odtwarzacza.
- `AudioFlowPlayerPanel` otrzymuje nowe propsy: `isPlaying`, stan czasu i obsługę nowych akcji (`onSkipBack`, `onSkipForward`); ikona play/pauza zmienia się dynamicznie.
- Pod panelem odtwarzacza dodawany jest przycisk „Zaawansowany odtwarzacz" nawigujący do `/(app)/projects/[id]/player`.

## Capabilities

### New Capabilities
- `inline-audio-player`: reużywalny hook audio + rozszerzony `AudioFlowPlayerPanel` z rzeczywistą kontrolą odtwarzania w widoku szczegółów projektu.

### Modified Capabilities

(brak — żadne istniejące wymagania na poziomie specyfikacji nie zmieniają się)

## Impact

- `apps/mobile/app/(app)/projects/[id]/index.tsx` — inicjuje hook audio, przekazuje propsy do panelu, renderuje przycisk „Zaawansowany odtwarzacz".
- `apps/mobile/app/(app)/projects/[id]/player.tsx` — refaktor: używa wspólnego hooka zamiast lokalnego stanu.
- `apps/mobile/components/audioflow.tsx` — rozszerzenie `AudioFlowPlayerPanel` o nowe propsy i przyciski skip.
- Nowy plik: `apps/mobile/lib/use-audio-player.ts` — hook zarządzający `Audio.Sound`, playlist i stanem odtwarzania.
- Zakres weryfikacji: `apps/mobile` (testy Jest, manualne sprawdzenie odtwarzania na iOS/Android/web).
- Cel poza zakresem: offline cache, pobieranie audio, sharing, OCR/TTS, billing, auth.
