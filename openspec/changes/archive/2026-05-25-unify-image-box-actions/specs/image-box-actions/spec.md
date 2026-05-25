# image-box-actions

## Purpose

Spójny pasek akcji karty zdjęcia strony, używany w trybie zaawansowanym kreatora nowego audiobooka (Krok 2) oraz w widoku „Zdjęcia stron” istniejącego projektu. Każda karta MUSI prezentować identyczny layout trzech grup akcji — wybór obszarów OCR (lewa), zmiana kolejności (środkowa), usunięcie (prawa) — i SHALL używać tych samych kontrolek o powierzchni dotykowej ≥ 44×44 pt.

## Requirements

### REQ-1 — Layout trzech grup

Pasek akcji każdej karty zdjęcia MUSI zawierać trzy grupy ułożone poziomo w jednym wierszu z `justifyContent: 'space-between'`:

1. **Grupa lewa**: dokładnie jeden przycisk wyboru obszarów OCR.
2. **Grupa środkowa**: dokładnie dwa przyciski zmiany kolejności (`przenieś wyżej`, `przenieś niżej`) ułożone obok siebie z odstępem `stackSm`.
3. **Grupa prawa**: dokładnie jeden przycisk usuwania zdjęcia.

Żadne inne przyciski akcji NIE MOGĄ być renderowane w pasku akcji.

#### Scenario: 3 grupy renderowane

- **GIVEN** karta zdjęcia w trybie zaawansowanym kreatora LUB w widoku „Zdjęcia stron”
- **WHEN** komponent się wyrenderuje
- **THEN** użytkownik widzi po lewej ikonę wyboru obszarów, po środku dwie strzałki góra/dół, po prawej ikonę usunięcia
- **AND** odstęp między grupą lewą i środkową oraz między środkową i prawą jest większy niż odstęp między samymi strzałkami (efekt `space-between`)

### REQ-2 — Powierzchnia dotykowa ≥ 44×44 pt

Każdy z czterech przycisków pasku akcji MUSI mieć efektywną powierzchnię dotykową ≥ 44×44 pt (suma `minWidth/minHeight` lub paddingu i `hitSlop`).

#### Scenario: Wymiar dotyku

- **GIVEN** wyrenderowany przycisk pasku akcji
- **WHEN** mierzymy jego `onLayout` szerokość i wysokość
- **THEN** obie wartości są ≥ 44

### REQ-3 — Ikony Feather

Przyciski MUSZĄ używać ikon Feather z `@expo/vector-icons`:

- wybór obszarów: `crop`
- przenieś wyżej: `arrow-up`
- przenieś niżej: `arrow-down`
- usuń: `trash-2`

Tekstowe symbole (`⊡`, `↑`, `↓`, `✕`, słowo „Usuń”) NIE MOGĄ pojawić się w pasku akcji.

#### Scenario: Ikony zamiast tekstu

- **GIVEN** karta zdjęcia
- **WHEN** komponent się wyrenderuje
- **THEN** test render nie znajduje węzła `Text` o wartości `Usuń`/`↑`/`↓`/`✕`/`⊡` w pasku akcji
- **AND** znajduje cztery węzły `Feather` o nazwach `crop`, `arrow-up`, `arrow-down`, `trash-2`

### REQ-4 — Badge liczby obszarów

Przycisk wyboru obszarów MUSI wyświetlać badge z liczbą zaznaczonych regionów dla danego zdjęcia, gdy ta liczba jest > 0. Gdy liczba wynosi 0, badge NIE MOŻE być widoczny.

#### Scenario: Badge widoczny

- **GIVEN** karta zdjęcia z `regionCount = 3`
- **WHEN** komponent się wyrenderuje
- **THEN** użytkownik widzi badge z napisem `3` przy ikonie `crop`

#### Scenario: Badge ukryty

- **GIVEN** karta zdjęcia z `regionCount = 0`
- **WHEN** komponent się wyrenderuje
- **THEN** badge NIE jest renderowany

### REQ-5 — Stan disabled strzałek

Przycisk `arrow-up` MUSI być disabled, gdy `index === 0`. Przycisk `arrow-down` MUSI być disabled, gdy `index === total - 1`. Disabled przycisk NIE MOŻE wywoływać `onPress` ani `onMoveUp/Down`.

#### Scenario: Pierwsze zdjęcie

- **GIVEN** karta z `index = 0`, `total ≥ 2`
- **WHEN** użytkownik dotyka `arrow-up`
- **THEN** `onMoveUp` NIE jest wywołane
- **AND** `accessibilityState.disabled === true`

#### Scenario: Ostatnie zdjęcie

- **GIVEN** karta z `index = total - 1`, `total ≥ 2`
- **WHEN** użytkownik dotyka `arrow-down`
- **THEN** `onMoveDown` NIE jest wywołane
- **AND** `accessibilityState.disabled === true`

### REQ-6 — Wybór obszarów z widoku „Zdjęcia stron”

Widok „Zdjęcia stron” (`projects/[id]/images.tsx`) MUSI obsługiwać kliknięcie ikony `crop`. SHALL otwierać istniejący widok wyboru obszarów OCR (`touch-ocr-region-selection`) dla wybranego `pageImageId`. Po powrocie liczniki `regionCount` na kartach SHALL być odświeżone.

#### Scenario: Otwarcie edytora obszarów

- **GIVEN** widok „Zdjęcia stron” projektu zawierającego ≥ 1 zdjęcie
- **WHEN** użytkownik dotyka ikony `crop` na karcie zdjęcia X
- **THEN** następuje nawigacja do widoku wyboru obszarów z `pageImageId = X`

#### Scenario: Odświeżenie po powrocie

- **GIVEN** użytkownik dodał 2 nowe regiony w edytorze obszarów i wrócił
- **WHEN** ekran „Zdjęcia stron” odzyskuje focus
- **THEN** karta zdjęcia X pokazuje zaktualizowany badge z `regionCount` uwzględniającym nowe regiony

### REQ-7 — Spójność wizualna między widokami

Komponent karty zdjęcia w trybie zaawansowanym kreatora i w widoku „Zdjęcia stron” MUSI być tym samym komponentem React (`PageImageCard` lub równoważny). Style paska akcji (padding, gap, kolory, ikony, rozmiar dotyku) MUSZĄ być identyczne.

#### Scenario: Identyczna implementacja

- **GIVEN** statyczna analiza kodu
- **WHEN** kontrolujemy źródło obu ekranów
- **THEN** oba importują ten sam komponent karty z `apps/mobile/components/`
- **AND** żaden z ekranów nie definiuje już inline stylów `cardActions`/`photoActions`/`smallButton`/`moveBtn`/`deleteBtn`/`deleteButton`
