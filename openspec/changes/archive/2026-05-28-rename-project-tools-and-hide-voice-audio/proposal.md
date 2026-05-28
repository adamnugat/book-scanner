## Why

Sekcja "Narzędzia projektu" na ekranie szczegółów projektu prezentuje dwa przyciski ("Zdjęcia stron" i "Głos i audio"), które nie odzwierciedlają docelowej architektury produktu. Funkcje głosu i audio mają zostać wbudowane bezpośrednio w ekran edycji audiobooka, a obecny podział na dwa osobne widoki jest tymczasowy. Zmiana porządkuje nawigację i przygotowuje grunt pod integrację głosu/audio w widoku edycji.

## What Changes

- Przycisk "Zdjęcia stron" zmienia nazwę na **"Edytuj audiobook"** — od teraz widok `/(app)/projects/[id]/images` jest nazywany "edycją audiobooka".
- Pole `summary` (status projektu po prawej stronie) jest **usuwane** z przycisku "Edytuj audiobook".
- Przycisk "Głos i audio" jest **ukryty** (renderowanie wyłączone, trasa i plik ekranu pozostają niezmienione).
- `PROJECT_TOOL_COUNT` zmniejsza się z `3` do `2` (widoczne przyciski: "Edytuj audiobook" + "Udostępnij").
- `accessibilityLabel` przycisku aktualizowany do "Otwórz edycję audiobooka".

**Non-goals:**
- Nie implementujemy integracji głosu/audio w widoku edycji audiobooka — to osobna iteracja.
- Nie usuwamy ekranu `voice.tsx` ani trasy `projects/[id]/voice`.
- Nie zmieniamy zachowania samego ekranu zdjęć/edycji audiobooka.
- Brak zmian w billing, sharing, OCR/TTS, storage, auth.

## Capabilities

### New Capabilities
<!-- brak nowych capabilities -->

### Modified Capabilities
<!-- Zmiany są wyłącznie w warstwie nawigacyjnej (etykiety, widoczność przycisków). Żadna spec-level behavior specyfikacja nie zmienia wymagań funkcjonalnych ekranów. -->

## Impact

- `apps/mobile/app/(app)/projects/[id]/index.tsx` — jedyny plik do zmiany.
- Weryfikacja: `npm run test:mobile`, `npm run lint`.
