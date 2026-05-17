## Context

Dashboard (`apps/mobile/app/(app)/index.tsx`) pobiera projekty z API przy każdym `useFocusEffect`. Sekcja „Ostatnio odtwarzane" jest wyświetlana gdy `sortedProjects[0]` istnieje. `ProjectCard` renderuje emoji `📖` gdy `coverUrl` jest null. `AudioFlowFooterMenu` zawsze renderuje 3 przyciski (Biblioteka, +, Odtwarzacz).

## Goals / Non-Goals

**Goals:**
- Sekcja „Ostatnio odtwarzane" znika natychmiast po usunięciu ostatniego projektu (nie czeka na refetch).
- `ProjectCard` bez `coverUrl` renderuje teksturę SVG zamiast emoji, dobieraną deterministycznie wg `project.id`.
- Na widoku `/(app)` dolny pasek zawiera tylko centralny przycisk `+`.

**Non-Goals:**
- Zmiana sekcji na innych ekranach niż `/(app)`.
- Persistowanie stanu „ostatnio odtwarzanego" w AsyncStorage / bazy.
- Zmiana struktury `AudioFlowFooterMenu` dla ekranów innych niż dashboard.
- Modyfikacje backendu, OCR/TTS, billing, auth.

## Decisions

### 1. Sekcja „Ostatnio odtwarzane" — reset przy usunięciu

**Decyzja**: `lastPlayed` pochodzi z `sortedProjects[0]` (reaktywnie z `projects` state). Stan jest już poprawny — gdy ostatni projekt zostanie usunięty przez `setProjects(prev => prev.filter(...))`, `sortedProjects` staje się puste, a `lastPlayed === null` chowa sekcję. Nie potrzeba dodatkowej logiki.

**Problem zgłoszony przez użytkownika**: Prawdopodobnie sekcja wskazuje na projekt, który jest wyświetlany jako „ostatnio odtwarzany" (najnowszy wg `updatedAt`), a po jego usunięciu (gdy jest jedynym projektem) sekcja znika dopiero po re-renderze. Obecna logika obsługuje to poprawnie — korekta będzie polegać na dodaniu explicit guard + testu weryfikującego scenariusz.

### 2. Tekstury SVG dla okładek projektów

**Decyzja**: Nowy komponent `ProjectCoverTexture` (React Native `Svg` via `react-native-svg`) generuje teksturę na podstawie `projectId`. Funkcja `getTextureIndex(id: string): 0..9` oblicza prosty hash sumy kodów znakowych modulo 10. Paleta kolorów z `audioFlowTokens.color.accent` i `audioFlowTokens.color.surface`. 10 wzorów: koncentryczne koła, siatka kwadratów, fale poziome, wzór sześciokątów, ukośne paski, gradient kół, wzór rombu, spirala prostokątów, wzór kafelkowy, abstrakcyjne cienie.

**Alternatywa rozważana**: Random na podstawie `Math.random()` — odrzucona, bo wartość zmienia się przy re-renderze. Obrazy rastrowe w `assets/` — odrzucone, za dużo statycznych plików.

**Zależność**: `react-native-svg` jest już w zależnościach Expo SDK 54, nie wymaga dodatkowej instalacji.

### 3. Dashboard-only bottom nav — tylko przycisk `+`

**Decyzja**: Nowy wariant propsów `AudioFlowFooterMenu` — dodać prop `variant?: 'full' | 'create-only'` (domyślnie `'full'`). Przy `variant='create-only'` renderowany jest tylko centralny przycisk `+`, bez bocznych. Alternatywnie: dashboard przekazuje `onLibraryPress={undefined}` i `onPlayerPress={undefined}` z warunkowym renderem. 

**Wybrana opcja**: Prop `variant='create-only'` — jawna intencja, nie poleganie na `undefined` propsach. Boczne przyciski są schowane (`display: none` przez warunkowy render), nie tylko disabled.

## Risks / Trade-offs

- [TextureSVG + RN Web] `react-native-svg` działa na web przez `react-native-svg-web`, Expo SDK 54 jest skonfigurowane. Ryzyko niskie.
- [Hash collision] Prosty hash może dawać tę samą teksturę dla podobnych ID. Akceptowalne — wizualna różnorodność, nie unikalność.
- [Testy nawigacji] Zmiana struktury `AudioFlowFooterMenu` wymaga aktualizacji istniejących testów sprawdzających obecność 3 przycisków.
