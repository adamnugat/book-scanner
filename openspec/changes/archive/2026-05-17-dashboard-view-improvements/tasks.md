## 1. Komponent ProjectCoverTexture

- [x] 1.1 Utworzyć `apps/mobile/components/ProjectCoverTexture.tsx` z funkcją `getTextureIndex(projectId: string): number` (hash sumy kodów znakowych % 10)
- [x] 1.2 Zaimplementować 10 wzorów SVG (`react-native-svg`) w `ProjectCoverTexture`: koncentryczne koła, siatka kwadratów, fale poziome, sześciokąty, ukośne paski, gradient kół, romby, spirale prostokątów, kafelki, abstrakcyjne cienie
- [x] 1.3 Kolory wszystkich wzorów SVG pobierać z `audioFlowTokens.color` (accent.pearlTint, accent.pearl, surface.card, itp.)
- [x] 1.4 Props komponentu: `projectId: string`, `size?: number`, `style?: StyleProp<ViewStyle>`

## 2. Integracja tekstury w ProjectCard

- [x] 2.1 W `apps/mobile/components/audioflow.tsx` — w `ProjectCard` zastąpić blok `<View style={styles.projectCoverMock}>` komponentem `<ProjectCoverTexture projectId={...} />`
- [x] 2.2 Dodać prop `projectId: string` do `ProjectCard` (wymagany gdy `coverUrl` jest null/undefined)
- [x] 2.3 W `apps/mobile/app/(app)/index.tsx` — przekazać `projectId={item.id}` do `ProjectCard`
- [x] 2.4 Sprawdzić inne miejsca użycia `ProjectCard` w codebase i zaktualizować wywołania

## 3. Dashboard-only bottom nav

- [x] 3.1 W `apps/mobile/components/audioflow.tsx` — dodać prop `variant?: 'full' | 'create-only'` do `AudioFlowFooterMenu` (domyślnie `'full'`)
- [x] 3.2 Przy `variant='create-only'` renderować wyłącznie centralny przycisk `+`, bez bocznych przycisków Biblioteka i Odtwarzacz
- [x] 3.3 W `apps/mobile/app/(app)/index.tsx` — przekazać `variant='create-only'` do `AudioFlowBottomNavigation` / `AudioFlowFooterMenu`
- [x] 3.4 Upewnić się, że `AudioFlowBottomNavigation` w `audioflow-global-navigation.tsx` przekazuje `variant` do `AudioFlowFooterMenu`

## 4. Weryfikacja sekcji „Ostatnio odtwarzane"

- [x] 4.1 Przejrzeć logikę `lastPlayed` w `index.tsx` — potwierdzić, że `sortedProjects[0]` reaktywnie staje się `null` gdy lista jest pusta po `handleDeleteProject`
- [x] 4.2 Jeśli wykryto lukę (np. stan nie aktualizuje się przed re-renderem) — dodać explicit check: `const lastPlayed = sortedProjects.find(p => !deletedIds.has(p.id)) ?? null`

## 5. Testy

- [x] 5.1 Napisać test jednostkowy dla `getTextureIndex` — ta sama wartość dla tego samego ID, różne wartości dla różnych ID, zakres 0..9
- [x] 5.2 Napisać test renderowania `ProjectCoverTexture` — renderuje SVG, nie renderuje emoji
- [x] 5.3 W testach dashboardu (`apps/mobile/__tests__/`) dodać scenariusz: usuń ostatni projekt → `dashboard-last-played` testID nie istnieje w drzewie
- [x] 5.4 Zaktualizować istniejące testy które sprawdzają obecność 3 przycisków w `AudioFlowFooterMenu` — dodać scenariusz dla `variant='create-only'`

## 6. Weryfikacja

- [x] 6.1 `npm run test:mobile` — wszystkie testy przechodzą
- [x] 6.2 `npm run lint` — brak błędów
- [ ] 6.3 Ręczna weryfikacja: usuń ostatni projekt → sekcja „Ostatnio odtwarzane" znika
- [ ] 6.4 Ręczna weryfikacja: karty projektów bez okładki pokazują tekstury SVG (nie emoji)
- [ ] 6.5 Ręczna weryfikacja: dolne menu dashboardu zawiera tylko przycisk `+`
