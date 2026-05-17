## Why

Ekran progresu w trybie kreatora automatycznego (`images.tsx`) używa hardkodowanych kolorów i stylów (`#18213d`, `#29355c`, `#06d6a0`, `#aebbd3`) zamiast tokenów AudioFlow design systemu. Trzy etapy przetwarzania (wgrywanie → OCR → audio) nie są widoczne jednocześnie — widać tylko aktualny, bez kontekstu co już minęło i co jeszcze zostało.

## What Changes

- Overlay progresu w `images.tsx` korzysta z tokenów `audioFlowTokens` i komponentu `GlassPanel` zamiast hardkodowanych wartości.
- Widoczna oś czasu (step tracker) z ikonami: ukończony krok (✓), aktualny (spinner), oczekujący (szary) — dla wszystkich 3 etapów jednocześnie.
- Typografia zmieniana na `audioFlowStyles.headlineMd` i `audioFlowStyles.body` (Quicksand / Varela Round).
- Kolor akcentu zmieniony z `#06d6a0` na `t.color.accent.pearl` (`#F0EAD6`).
- Obramowania z `t.color.surface.glassEdge` zamiast `#29355c`.

## Capabilities

### New Capabilities

- `audiobook-creation-progress-screen`: Nakładka progresu kreatora automatycznego dopasowana do AudioFlow design systemu — glass panel, oś czasu 3 etapów, pearl accent, tokeny typografii.

### Modified Capabilities

- `audiobook-creation-wizard`: Widok etapu `images.tsx` zmienia wygląd overlaya progresu; logika biznesowa (polling, kolejność kroków) bez zmian.

## Impact

- `apps/mobile/app/(app)/projects/new/images.tsx` — wymiana stylów overlaya i dodanie komponentu osi czasu.
- `apps/mobile/components/audioflow.tsx` — możliwe dodanie pomocniczego komponentu `ProcessingStepTracker` jeśli scope uzasadnia wydzielenie; w przeciwnym razie inline w `images.tsx`.
- Bez zmian w API, backendzie, typach shared ani logice OCR/TTS.
- Weryfikacja: `npm run test:mobile`, `npm run lint`.
