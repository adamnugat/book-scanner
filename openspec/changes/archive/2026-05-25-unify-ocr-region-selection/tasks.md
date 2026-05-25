## 1. Przygotowanie typów i tokenów

- [x] 1.1 Wyciągnąć/ustabilizować typ `RegionDraft` używany w obu ekranach. Umieścić w `apps/mobile/lib/text-region-geometry.ts` lub w pliku komponentu i importować w obu miejscach.
- [x] 1.2 Zweryfikować w `apps/mobile/components/audioflow-tokens.ts` istnienie tokenów dla semantycznych akcentów regionu (zielony „solid", czerwony „live drag"). Jeśli brak — dodać `accent.success` / `accent.warn` (lub równoważne) bez zmian w istniejących kolorach.

## 2. Komponent `OcrRegionEditor`

- [x] 2.1 Utworzyć `apps/mobile/components/OcrRegionEditor.tsx` jako pełnoekranowy widok wewnątrz `AudioFlowScreen` + `FadeZoomContent`.
- [x] 2.2 Zaimplementować props: `target: OcrEditorTarget`, `initialRegions: EditorRegion[]`, `pageLabel: string`, `onCancel: () => void`, `onSave: (regions: EditorRegion[]) => void`.
- [x] 2.3 Zaimplementować podgląd zdjęcia w `GlassPanel` z `PageImagePreview` (resizeMode `contain`) i overlay regionów oraz drag rectangle (gestures: `onResponderGrant`/`Move`/`Release`).
- [x] 2.4 Użyć `createNormalizedRegion` i `denormalizeRegion` z `apps/mobile/lib/text-region-geometry.ts` (bez modyfikacji geometrii).
- [x] 2.5 Zaimplementować listę regionów z akcją „Usuń" (ikona Feather `trash-2` z `@expo/vector-icons`), licznikiem regionów i komunikatem „Brak regionów — OCR odczyta całą stronę." gdy lista jest pusta.
- [x] 2.6 Stylowanie wyłącznie przez `audioFlowTokens` / `audioFlowStyles`. Zero surowych hex literali w pliku.
- [x] 2.7 Akcje dolne („Anuluj", „Zapisz") wyrenderować przez `GhostButton` + `PearlButton` z design systemu; akcja główna = pearl accent.
- [x] 2.8 Eksport komponentu z `apps/mobile/components/OcrRegionEditor.tsx` (importowany bezpośrednio z tej ścieżki; brak osobnego barrel'a w repo).

## 3. Wpięcie w kreator nowych audiobooków

- [x] 3.1 W `apps/mobile/app/(app)/projects/new/images.tsx` usunąć wbudowany `<Modal>` edytora regionów wraz z `styles.editor*`, `regionOverlay`, `dragOverlay`, `editorRegionRow` itp.
- [x] 3.2 Usunąć lokalne handlery duplikujące logikę edytora: `closeRegionEditor`, `saveRegionEditor`, `removeEditorRegion`, `onPreviewLayout`, `beginDrag`, `updateDrag`, `finishDrag`, `renderRegionOverlay` — po przeniesieniu do komponentu pozostawić tylko zarządzanie `editingItem` w state kreatora oraz helpery do budowania props.
- [x] 3.3 Wyrenderować `OcrRegionEditor` jako pełnoekranowy overlay (`StyleSheet.absoluteFill`) gdy `editingItem` jest ustawione. Przekazać `target` (uploaded/pending), `initialRegions` (filtr po `pageImageId` / `pendingUri`), `onCancel` = ustaw `editingItem = null`, `onSave` = merge do `regions` + clear `editingItem`.
- [x] 3.4 Sprawdzić, że tryb automatyczny (`mode === 'auto'`) jest niezmieniony.

## 4. Nowa trasa dla widoku „Zdjęcia stron"

- [x] 4.1 Utworzyć `apps/mobile/app/(app)/projects/[id]/text-regions/[pageImageId].tsx`. W komponencie pobrać params `id` + `pageImageId`, załadować `api.getImages(id)` + `api.getTextRegions(id)`, znaleźć obraz, sfiltrować regiony tej strony, wyrenderować `OcrRegionEditor`.
- [x] 4.2 `onCancel` = `router.canGoBack() ? router.back() : router.replace('/(app)/projects/${id}/images')`.
- [x] 4.3 `onSave` = merge: pobrać pełną listę regionów projektu, podmienić regiony dla danego `pageImageId`, zapisać przez `api.saveTextRegions(id, payload)`, na sukces `router.back()`/`replace`; na błąd `Alert.alert('Błąd', message)` zgodnie z wzorcem w `[id]/images.tsx`.
- [x] 4.4 Dodać do `apps/mobile/app/(app)/_layout.tsx` wpis `<Stack.Screen name="projects/[id]/text-regions/[pageImageId]" options={{ headerShown: false }} />`.

## 5. Zmiana wejścia z „Zdjęcia stron"

- [x] 5.1 W `apps/mobile/app/(app)/projects/[id]/images.tsx` zmienić `openRegionEditor` tak, by `router.push` szedł na `/(app)/projects/${id}/text-regions/${imageId}` (segment trasy, bez query).
- [x] 5.2 Istniejący `useFocusEffect` już wywołuje `loadImages` (które pobiera regiony) — re-fetch regionCounts po powrocie z edytora działa bez dodatkowych zmian.

## 6. Usunięcie starego ekranu „Regiony tekstu"

- [x] 6.1 Usunąć plik `apps/mobile/app/(app)/projects/[id]/text-regions.tsx`.
- [x] 6.2 Usunąć wpis `<Stack.Screen name="projects/[id]/text-regions" options={{ title: 'Regiony tekstu' }} />` w `apps/mobile/app/(app)/_layout.tsx`.
- [x] 6.3 `grep -R "text-regions[^/]" apps/mobile` — pozostały tylko odwołania do endpointów backend (`scenes/text-regions` w `lib/api.ts`); zaktualizowane testy i stary plik usunięty.

## 7. Testy i weryfikacja

- [ ] 7.1 (Opcjonalnie) Dodać testy jednostkowe Jest dla `OcrRegionEditor` (rysowanie, lista, usuwanie, callbacki `onSave`/`onCancel`, brak regionów). Obecnie pokrycie przez integrację: `project-images.test.tsx`, `new-project-images-wizard.test.tsx`.
- [x] 7.2 Usunąć stary test `__tests__/text-regions.test.tsx` i zaktualizować URL w `project-images.test.tsx` (`text-regions?pageImageId=` → `text-regions/imageId`).
- [x] 7.3 `npm run lint` zielony. `npx tsc --noEmit` zielony dla zmienionych plików (preexisting błędy w `voice-audio.test.tsx`/`jest-setup.ts`/`PageImageCard.tsx` nie wynikają z tej zmiany). `npx jest project-images.test` i `new-project-images-wizard` zielone; `app.test.tsx` 5 failure preexisting na `main`.
- [ ] 7.4 Manualnie zweryfikować przepływy na web (oraz iOS/Android jeśli dostępne):
  - kreator → tryb zaawansowany → edycja regionów na uploadowanym zdjęciu i na pending asset → Anuluj wraca do listy w kreatorze; Zapisz aktualizuje licznik regionów.
  - „Zdjęcia stron" → edycja regionów → Anuluj wraca do „Zdjęć stron"; Zapisz aktualizuje licznik regionów na karcie.

## 8. Wewnętrzna dokumentacja

- [x] 8.1 `graphify update .` uruchomione — graf zsynchronizowany (3265 nodes, 4113 edges).
- [ ] 8.2 (Opcjonalnie) Wzmianka w CHANGELOG/notes projektu o usuniętej trasie `projects/[id]/text-regions` (skipped — brak CHANGELOG w repo).
