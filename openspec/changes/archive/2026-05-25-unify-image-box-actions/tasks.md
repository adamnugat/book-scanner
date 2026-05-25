## 1. Wspólny komponent `PageImageCard`

- [x] 1.1 Utworzyć `apps/mobile/components/PageImageCard.tsx` — przyjmuje propsy z design.md (sekcja 1)
- [x] 1.2 Zaimplementować pomocniczy `IconButton` (lokalnie w pliku lub osobno) — Feather ikona, `minWidth/minHeight: 44`, wsparcie dla `disabled`, `tone='danger'`, opcjonalny badge nad ikoną
- [x] 1.3 Layout paska akcji: `flexDirection: 'row'`, `justifyContent: 'space-between'`; trzy `View` (lewa: `crop`, środek: `arrow-up` + `arrow-down`, prawa: `trash-2`)
- [x] 1.4 `accessibilityLabel` per akcja (PL): „Wybierz obszary OCR dla {nazwa}", „Przenieś {nazwa} wyżej", „Przenieś {nazwa} niżej", „Usuń {nazwa}"
- [x] 1.5 `testID` per akcja (props-driven prefix, np. `${testID}-select-regions`, `-move-up`, `-move-down`, `-delete`)
- [x] 1.6 Test Jest `__tests__/page-image-card.test.tsx` — render 3 grup, disabled przy `index === 0` / `index === total - 1`, wywołanie callbacków, badge widoczny tylko gdy `regionCount > 0`

## 2. Refaktor `projects/new/images.tsx` (tryb zaawansowany)

- [x] 2.1 Zaimportować `PageImageCard`
- [x] 2.2 Zastąpić ciało `renderAdvancedItem` użyciem `<PageImageCard … />` — przekazać `imageId`, `uri`, `displayName`, `index`, `total: images.length`, `regionCount: imageRegions.length`, callbacki: `openRegionEditor`, `moveUploadedImage(idx, -1)`, `moveUploadedImage(idx, 1)`, `deleteUploadedImage`
- [x] 2.3 Usunąć nieużywane już style `smallButton`, `smallButtonDisabled`, `smallButtonText`, `deleteButton`, `deleteText`, `regionBadge`, `photoActions` (przeniesione do `PageImageCard`)
- [x] 2.4 Element `pending` (asset przed uploadem) używa tych samych akcji — przeniesione na `PageImageCard` bez statusu `pending` (akcje aktywne na pending assetach; `status='pending'` zarezerwowane na trwający upload, obecnie nieaktywne w tym ekranie)

## 3. Refaktor `projects/[id]/images.tsx` (widok „Zdjęcia stron")

- [x] 3.1 Zaimportować `PageImageCard`
- [x] 3.2 Zastąpić ciało `renderImage` użyciem `<PageImageCard … />` — analogiczne propsy do Kroku 2.2
- [x] 3.3 Dodać handler `openRegionEditor(imageId)` — nawigacja do `/(app)/projects/{id}/text-regions?pageImageId={imageId}`
- [x] 3.4 Pobrać liczniki regionów per zdjęcie — `api.getTextRegions(id)` w `loadImages`, zliczone do mapy `regionCounts: Record<string, number>`, przekazane do każdej karty jako `regionCount`
- [x] 3.5 Po powrocie z edytora obszarów odświeżyć liczniki regionów — `useFocusEffect(loadImages)` refetchuje regions po fokusie
- [x] 3.6 Usunięto style `card`, `cardRow`, `pageNum`, `thumb`, `cardInfo`, `filename`, `meta`, `cardActions`, `moveBtn`, `moveBtnDisabled`, `moveBtnText`, `deleteBtn`, `deleteBtnText`

## 4. Ikony Feather

- [x] 4.1 `@expo/vector-icons` już zainstalowane (używane w `audioflow.tsx`)
- [x] 4.2 `Feather` z `crop`, `arrow-up`, `arrow-down`, `trash-2` w `IconActionButton`
- [x] 4.3 Rozmiar 22 px, kolor `t.color.text.onDark` (default) lub `t.color.accent.danger` (tone='danger')

## 5. Aktualizacja istniejących testów Jest

- [x] 5.1 `new-project-images-wizard.test.tsx` — stabilne `accessibilityLabel` zachowane przez `PageImageCard`; istniejące asercje pass bez modyfikacji
- [x] 5.2 `project-images.test.tsx` — dodany mock `getTextRegions`, mock `router.push` skonsolidowany, nowy test „opens OCR region editor", nowy test „renders reorder and delete buttons"
- [x] 5.3 `page-image-card.test.tsx` — pokrywa render, disabled boundaries, callbacks, badge visibility

## 6. Wiring text-regions screen

- [x] 6.1 `text-regions.tsx` obsługuje opcjonalny query param `pageImageId` — przy fokusie auto-otwiera edytor dla wskazanego zdjęcia (z `autoOpenedRef`, żeby nie wymuszać ponownego otwarcia)

## 7. Weryfikacja

- [x] 7.1 `npm run test:mobile` — 15/16 suite zielone, 83/88 testów; 5 fail w `app.test.tsx` (dashboard last-played) potwierdzone jako pre-existing na bazowym main (sprawdzone przez stash + rerun)
- [x] 7.2 `npm run lint` — brak błędów
- [x] 7.3 `npm run format:check` — sformatowane (zastosowano `prettier --write` na zmienionych plikach)
- [ ] 7.4 Manualnie: kreator → Krok 2 (tryb zaawansowany) → dodaj 3 zdjęcia → sprawdź 3 grupy przycisków, hit ≥ 44 pt, badge regionów, ↑/↓ disabled na granicach, usuwanie działa
- [ ] 7.5 Manualnie: szczegóły projektu → „Zdjęcia stron" → identyczny widok kart, kliknięcie ikony `crop` otwiera edytor obszarów; po zapisie regionów licznik się aktualizuje
