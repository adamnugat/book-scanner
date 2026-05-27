## REMOVED Requirements

### Requirement: REQ-1 — Layout trzech grup

**Reason**: Karta zdjęcia zostaje przeprojektowana na układ trzykolumnowy (uchwyt drag-and-drop + numer, miniaturka/nazwa + ikony statusu, edycja + kosz). Dotychczasowy pasek „trzy grupy akcji" (obszary / strzałki / usuń) przestaje istnieć.
**Migration**: Patrz nowa zdolność `page-image-status-card` — wymaganie „Układ trzykolumnowy karty zdjęcia".

### Requirement: REQ-3 — Ikony Feather

**Reason**: Ikony `arrow-up`/`arrow-down` znikają wraz z usunięciem strzałek reorder; pozostałe ikony (uchwyt drag, obszary, audio, edycja, kosz) definiuje nowa karta.
**Migration**: Patrz `page-image-status-card` — wymagania „Uchwyt drag-and-drop z numerem porządkowym", „Sekwencyjny rząd ikon statusu", „Kosz usuwa zdjęcie z listy". Ikony nadal pochodzą z Feather (`@expo/vector-icons`).

### Requirement: REQ-5 — Stan disabled strzałek

**Reason**: Zmiana kolejności odbywa się wyłącznie przez drag-and-drop; przyciski strzałek i ich stany disabled nie istnieją.
**Migration**: Patrz `page-image-status-card` — wymaganie „Uchwyt drag-and-drop z numerem porządkowym".

## MODIFIED Requirements

### Requirement: REQ-6 — Wybór obszarów z widoku „Zdjęcia stron”

Widok „Zdjęcia stron” (`projects/[id]/images.tsx`) MUST obsługiwać dotknięcie ikony obszarów na karcie zdjęcia, gdy przełącznik „wybór obszarów" w ustawieniach ogólnych jest włączony. SHALL otwierać **modal** wyboru obszarów OCR (współdzielony `OcrRegionEditor`) dla wybranego `pageImageId`, bez nawigacji do osobnej trasy. Po zapisaniu liczniki obszarów na kartach SHALL być odświeżone.

#### Scenario: Otwarcie modala obszarów

- **GIVEN** widok „Zdjęcia stron” z włączonym przełącznikiem „wybór obszarów" i ≥ 1 zdjęciem
- **WHEN** użytkownik dotyka ikony obszarów na karcie zdjęcia X
- **THEN** aplikacja MUST otworzyć modal wyboru obszarów dla `pageImageId = X`
- **AND** NIE MUST nawigować do osobnego ekranu

#### Scenario: Odświeżenie po zapisaniu

- **GIVEN** użytkownik dodał 2 nowe obszary w modalu i zapisał
- **WHEN** modal się zamknie
- **THEN** karta zdjęcia X MUST pokazać zaktualizowaną liczbę obszarów na ikonie statusu
