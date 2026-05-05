## Why

Użytkownik nie może wiarygodnie zweryfikować, czy strony książki zostały poprawnie dodane, ponieważ zdjęcia stron nie zawsze wyświetlają się prawidłowo, a po wykonaniu zdjęć brakuje czytelnego podglądu przed dalszą pracą. To blokuje podstawowy przepływ MVP: dodanie stron → kontrola kolejności i jakości → OCR.

## What Changes

- Poprawić wyświetlanie zdjęć stron w aplikacji mobilnej/web, tak aby miniatury i pełne obrazy korzystały z prawidłowych URL-i oraz miały obsługę stanów ładowania i błędu.
- Dodać podgląd wykonanych lub wybranych zdjęć przed wysłaniem albo bezpośrednio po przechwyceniu, zależnie od istniejącego przepływu UI.
- Zapewnić, że nowo dodane zdjęcia są od razu widoczne na liście stron z prawidłową numeracją, nazwą i możliwością usunięcia/reorder.
- Utrzymać istniejące limity uploadu, walidację typów plików, prywatność projektów i autoryzowany dostęp do assetów.
- Non-goals: brak zmian w billing/limitach planów, udostępnianiu projektów, OCR/TTS providerach, modelu autoryzacji oraz mechanizmie przechowywania plików poza tym, co jest konieczne do poprawnego pobrania i renderowania obrazów.

## Capabilities

### New Capabilities
- `page-image-capture-preview`: Obsługuje poprawne wyświetlanie zdjęć stron oraz podgląd zdjęć wykonanych lub wybranych przed kontynuowaniem przepływu.

### Modified Capabilities
- Brak.

## Impact

- Affected workspaces: `apps/mobile` przede wszystkim w ekranie zdjęć projektu i klientach API; możliwe punktowe zmiany w `apps/api`, jeśli problem wynika z generowania albo serwowania URL-i obrazów.
- Affected systems: upload zdjęć stron, lista miniatur, podgląd zdjęć, autoryzowane endpointy obrazów, obsługa błędów UI dla obrazów.
- API shape powinien pozostać zgodny z istniejącym kontraktem `PageImageResponse`; zmiany w `packages/shared` tylko jeśli implementacja ujawni brakujące pole wymagane przez UI.
- Verification scope: testy mobilne dla przepływu zdjęć, testy API obrazów jeśli zmieni się serwowanie URL-i/assetów, oraz lint/format dla zmienionych workspace'ów.
