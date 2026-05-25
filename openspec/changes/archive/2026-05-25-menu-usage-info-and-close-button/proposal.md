## Why

Menu nawigacyjne otwierane przyciskiem w prawym górnym rogu ekranu nie pokazuje informacji o aktywnym pakiecie i wykorzystaniu limitów, a użytkownik musi przechodzić do dedykowanego ekranu Cennik, żeby sprawdzić stan konta. Brak przycisku zamknięcia menu wymusza zamknięcie przez kliknięcie tła, co jest mniej intuicyjne.

## What Changes

- **Informacje o pakiecie w menu**: Na dole arkusza menu (`NavigationMenuSheet`) pojawia się sekcja „Twoje wykorzystanie" — taka sama jak karta na ekranie Cennik: aktywny plan, paski postępu stron i projektów, okres rozliczeniowy.
- **Przycisk zamknięcia menu**: W prawym górnym rogu arkusza menu wyświetla się ikona `X` (`RoundIconButton` z ikoną `x` z Feather) zamykająca modal.

## Capabilities

### Modified Capabilities

- `navigation-menu`: Rozszerzone o sekcję wykorzystania pakietu na dole i przycisk zamknięcia X w prawym górnym rogu.

## Impact

- **apps/mobile**: `components/audioflow-global-navigation.tsx` — `NavigationMenuSheet` pobiera dane `getMyUsage()` i renderuje `UsageCard` + `CloseButton`.
- Komponent `UsageBar` i logika renderowania zostają wyekstrahowane lub zduplikowane z `pricing/index.tsx` do wspólnego miejsca albo lokalnie w pliku nawigacji.
- **packages/shared**: brak zmian API — `api.getMyUsage()` już istnieje.
- **apps/api**: brak zmian.
- **Weryfikacja**: `npm run test:mobile`, `npm run lint`.

**Non-goals**: zmiany w stylach ekranu Cennik, modyfikacje ekranu planów/upgrade, animacje arkusza menu, obsługa błędów sieciowych z retry.
