## Why

Kreator tworzenia audiobooka nie zapewnia poprawnej kolejności operacji w trybie automatycznym (OCR musi w pełni zakończyć się przed startem TTS) oraz brakuje mu kluczowych elementów UX w trybie zaawansowanym: przycisku wyboru obszarów OCR bezpośrednio na liście zdjęć i kompletnego trzystopniowego przepływu z ręczną korektą tekstu przed generowaniem audio.

## What Changes

- **Tryb automatyczny**: submit kolejkuje OCR, czeka na jego zakończenie (polling), następnie uruchamia TTS — gwarantowana sekwencja.
- **Tryb zaawansowany – lista zdjęć (Krok 2)**: przycisk usunięcia zmieniony na ikonę (zamiast tekstu); dodany nowy przycisk wyboru obszarów OCR przy każdym zdjęciu.
- **Tryb zaawansowany – podgląd obszarów**: nowy widok umożliwiający rysowanie prostokątnych obszarów OCR na zdjęciu i ich usuwanie; dostępny po kliknięciu przycisku wyboru obszarów.
- **Tryb zaawansowany – submit (Krok 2→3)**: przycisk submit uruchamia OCR i przenosi do Kroku 3.
- **Tryb zaawansowany – Krok 3 (korekta)**: wyświetla wyniki OCR dla każdego zdjęcia w edytowalnym `textarea`; submit uruchamia TTS i kończy kreator.

## Capabilities

### New Capabilities

- `image-area-selection-in-wizard`: Wybór prostokątnych obszarów OCR bezpośrednio w Kroku 2 kreatora zaawansowanego — nowy widok podglądu zdjęcia z rysowaniem/usuwaniem zaznaczonych regionów przed uruchomieniem OCR.

### Modified Capabilities

- `audiobook-creation-wizard`: Rozszerzone AC-2 (nowy przycisk obszarów + ikona usuwania), AC-5 (gwarantowana sekwencja OCR→TTS), AC-6 (kompletny przepływ Krok 2→3→odtwarzacz z korektą tekstu).

## Impact

- **apps/mobile**: `projects/new/images.tsx` (Krok 2 UI, runAutomaticFlow, runAdvancedFlow), nowy ekran/modal podglądu z selekcją obszarów.
- **apps/mobile**: `projects/new/review.tsx` (Krok 3 — korekta OCR + submit TTS).
- **packages/shared**: brak nowych kontraktów API — istniejące endpointy `process-ocr-batch`, `generate-audio`, `text-regions` wystarczają.
- **apps/api**: brak zmian — backend już obsługuje potrzebne operacje.
- **Weryfikacja**: `npm run test:mobile`, `npm run lint`.

**Non-goals**: zmiany w dostawcach OCR/TTS, modelu subskrypcji, systemie udostępniania, przechowywaniu plików, mechanizmie autoryzacji.
