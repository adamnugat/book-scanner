## Context

Aplikacja mobilna wyświetla słowo „projekt" w wielu miejscach UI mimo że produkt jest dedykowany tworzeniu audiobooków. Zmiana jest czysto prezentacyjna — dotyczy tylko stringów widocznych dla użytkownika w `apps/mobile`. Modele danych, trasy API, typy w `packages/shared` i backend pozostają bez zmian.

## Goals / Non-Goals

**Goals:**
- Zastąpić wszystkie polskie stringi UI `projekt/projektu/projekty/projektów` na `audiobook/audiobooka/audiobooki/audiobooków`
- Zaktualizować testy jednostkowe, które assertują na te stringi

**Non-Goals:**
- Zmiana nazw zmiennych, funkcji, kluczy obiektów, tras URL, modeli Prisma
- Jakiekolwiek zmiany w `apps/api`, `packages/shared`, plikach konfiguracyjnych
- Tłumaczenia ani i18n

## Decisions

**Tylko tekst widoczny dla użytkownika** — zmieniamy wyłącznie wartości przekazywane jako `children` do komponentów `<Text>`, argumenty `Alert.alert()`, oraz atrybuty `options.title` w nawigatorze Stack. Nie dotykamy nazw props, zmiennych, tras.

**Odmiana polska ręcznie** — zamiast mechanicznego `replace`, każde wystąpienie dostosowujemy do gramatycznego kontekstu:
- „projekt" (mianownik) → „audiobook"
- „projektu" (dopełniacz) → „audiobooka"
- „projekty" (liczba mnoga) → „audiobooki"
- „projektów" (dopełniacz l.mn.) → „audiobooków"

**Testy aktualizujemy razem z kodem** — testy w `__tests__/` assertują na tekst UI, więc muszą być zaktualizowane w tym samym kroku co źródła.

## Risks / Trade-offs

- Brak ryzyka regresji backendowej — zmiany izolowane do `apps/mobile`
- Możliwość pominięcia wystąpienia → Mitygacja: `grep -rn "projekt" apps/mobile` po każdej edycji jako weryfikacja końcowa
- Testy e2e (jeśli istnieją) mogą assertować na stare stringi → Mitygacja: przejrzenie wszystkich plików `__tests__/` przed zamknięciem zadania
