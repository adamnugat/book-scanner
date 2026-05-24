## Context

Mobilna aplikacja Expo (`apps/mobile`) ma dwa miejsca, w których wyświetla kartę zdjęcia strony z przyciskami akcji:

- `app/(app)/projects/new/images.tsx` — `renderAdvancedItem` (linie ~518–579) w kreatorze nowego audiobooka, tryb zaawansowany. Cztery `Pressable` ułożone w `flex-direction: row` z `gap: 8`: ⊡ (otwiera `touch-ocr-region-selection`, z badge liczby `TextRegion`), ↑, ↓ (przesuwanie indeksu w `images`), ✕ (`deleteUploadedImage`). Styl `smallButton` ma padding 12/5 — pole dotyku znacząco poniżej 44 pt.
- `app/(app)/projects/[id]/images.tsx` — `renderImage` (linie ~212–249) w widoku zdjęć istniejącego projektu („Zdjęcia stron”). Trzy `Pressable`: ↑, ↓ (`moveImage`), Pressable z tekstem „Usuń” (`handleDelete`). Brak przycisku wyboru obszarów OCR. Styl `moveBtn`/`deleteBtn` ma padding 14/6 — również poniżej 44 pt.

Oba widoki używają `GlassPanel` (`components/audioflow.tsx`) i `PageImagePreview` (`components/PageImagePreview.tsx`), ale układ akcji jest duplikowany inline. Nie ma wspólnego komponentu karty zdjęcia.

Memory użytkownika: ikony zawsze z biblioteki Feather (`@expo/vector-icons`).

## Goals / Non-Goals

**Goals:**

- Identyczny pasek akcji karty zdjęcia w trybie zaawansowanym kreatora i w widoku „Zdjęcia stron”.
- Trzy semantycznie pogrupowane segmenty: wybór obszarów (lewy), kolejność (środkowy ↑ + ↓), usunięcie (prawy).
- Minimalna powierzchnia dotykowa ≥ 44×44 pt dla każdej akcji.
- Ekstrakcja wspólnego komponentu `PageImageCard` zamiast duplikowania JSX/stylów.
- Ikony Feather zamiast znaków tekstowych.

**Non-Goals:**

- Zmiany w komponencie wyboru obszarów (`touch-ocr-region-selection`).
- Zmiany w backendzie, kontraktach API i Prisma.
- Zmiana semantyki akcji (kolejność, usunięcie, wybór obszarów już istnieją).
- Drag-and-drop reorder (poza zakresem — zostają strzałki).
- Redesign innych elementów karty (badge regionów, wskaźnik upload, przezroczystości).

## Decisions

### 1. Wspólny komponent `components/PageImageCard.tsx`

**Problem:** duplikacja layoutu/stylów między dwoma ekranami i divergencja (różne ikony, brak obszarów w `[id]/images.tsx`).

**Decyzja:** wydzielić `PageImageCard` przyjmujący propsy:

```ts
type PageImageCardProps = {
  imageId: string;
  uri?: string;
  displayName: string;
  index: number;
  total: number;
  regionCount?: number;
  onSelectRegions: (imageId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (imageId: string) => void;
  status?: 'pending' | 'uploaded' | 'failed';
  testID?: string;
};
```

Komponent renderuje `GlassPanel` → `PageImagePreview` → pasek `actions`. Pasek ma `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`. Trzy `View` (grupy):

- `left`: `<IconButton icon="crop" onPress={() => onSelectRegions(imageId)} badge={regionCount} />`
- `center`: `<View style={{ flexDirection: 'row', gap: stackSm }}>` z dwoma `IconButton` (`arrow-up`, `arrow-down`), `disabled` na granicach (`index === 0`, `index === total - 1`).
- `right`: `<IconButton icon="trash-2" tone="danger" onPress={() => onDelete(imageId)} />`.

`IconButton` — lokalna pomocnicza funkcja (lub osobny mały komponent) z padding tak dobranym, by `hitSlop` + padding dawały ≥ 44×44 pt; tło `glassLight`; `tone="danger"` zmienia kolor ikony/tła.

**Alternatywa odrzucona:** osobne karty per widok z prop-driven konfiguracją — duplikuje style i utrudnia spójność.

### 2. Ikony Feather

`crop` (wybór obszarów), `arrow-up`, `arrow-down`, `trash-2`. Rozmiar 22 px (czytelny w 44 pt polu). Kolor inherit z `audioflow-tokens`. Brak tekstu obok ikony.

### 3. Layout 3 grup

`actions` używa `justifyContent: 'space-between'`. Grupa środkowa ma własny `gap: stackSm` między ↑ a ↓. Brak zewnętrznego `gap` — `space-between` dystrybuuje przestrzeń. To gwarantuje wizualną hierarchię (akcja destruktywna „daleko” od akcji selekcji).

### 4. Widok „Zdjęcia stron” zyskuje przycisk obszarów

`projects/[id]/images.tsx` dziś nie woła `touch-ocr-region-selection`. Decyzja: dodać handler `openRegionEditor(imageId)`, który nawiguje do istniejącego ekranu wyboru obszarów (taką samą trasą jak z kreatora). Po powrocie odświeżyć licznik `TextRegion` per zdjęcie (`api.getTextRegions(projectId)` lub analogiczne — sprawdzić istniejący kontrakt; jeśli ekran detalu już to pobiera, reużyć).

**Alternatywa odrzucona:** ukrycie przycisku obszarów w widoku „Zdjęcia stron” — łamie wymóg „identyczny widok boxów”.

### 5. Wymiar dotykowy ≥ 44×44 pt

`IconButton` ma `minWidth: 44`, `minHeight: 44`, `alignItems: 'center'`, `justifyContent: 'center'`. Tło `glassLight` zachowane. To zwiększa wysokość paska akcji vs obecnie — akceptowalne (karta zdjęcia jest duża).

## Risks / Trade-offs

- **Większe karty** → pasek akcji rośnie. Mitigation: zmieścić w istniejącej szerokości karty; przetestować na małych ekranach (375 pt).
- **Nawigacja do edytora obszarów z widoku „Zdjęcia stron”** → trasa wcześniej tylko z kreatora; sprawdzić routing zwrotny do `projects/[id]/images.tsx` (analogicznie do mitygacji opisanej w `creator-workflow-enhancements`).
- **Refresh licznika regionów po powrocie z edytora obszarów** → musi działać na obu widokach (kreator + „Zdjęcia stron”). Mitigation: jednolity hook/source-of-truth (np. `useFocusEffect` refetch).
- **Aktualizacja testów Jest** → istniejące testy patrzą na strukturę DOM/`accessibilityLabel`. Mitigation: zachować stabilne `accessibilityLabel`, dodać `testID` propsami.
- **Brak shared package zmian** → kontrakty API i Prisma niezmienne; refaktor czysto mobilny.

## Test Strategy

- Jednostkowe testy Jest `PageImageCard` — render 3 grup, disabled na granicach, wywołanie callbacków.
- Aktualizacja `apps/mobile/__tests__/new-project-images-wizard.*` (lub równoważnego) — nowa struktura/labels.
- Nowy/zaktualizowany test ekranu „Zdjęcia stron” — kliknięcie ikony `crop` nawiguje do edytora obszarów.
- Lint + format check.
