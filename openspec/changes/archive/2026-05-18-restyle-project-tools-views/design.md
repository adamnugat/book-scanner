## Context

Trzy widoki `images.tsx`, `voice.tsx`, `sharing.tsx` używają starej, granatowej palety kolorów (`#16213e`, `#0f3460`, `#1a1a2e`, `#e94560`, `#06d6a0`) i statycznych `StyleSheet` bez odniesienia do `audioFlowTokens`. Reszta aplikacji (dashboard, `projects/[id]/index.tsx`, overlay postępu) jest już w pełni zmigrowana na design system AudioFlow — stare ekrany są widoczną anomalią.

Wzorzec referencyjny: `apps/mobile/app/(app)/projects/[id]/index.tsx` — pełne użycie `audioFlowTokens`, `AudioFlowScreen`, `TopAppBar`, `GlassPanel`, `PearlButton`, `GhostButton`, `SectionHeading`.

## Goals / Non-Goals

**Goals:**
- Zastąpić hardkodowane kolory/wymiary tokenami z `audioFlowTokens`
- Dodać `TopAppBar` z przyciskiem powrotu do każdego widoku
- Użyć `GlassPanel` zamiast `backgroundColor: '#16213e'` dla kart
- Użyć `PearlButton` dla głównych CTA, `GhostButton` dla drugorzędnych
- Użyć `AudioFlowTextField` zamiast surowego `TextInput` w `sharing.tsx`
- Użyć `RoundIconButton` dla przycisków play/pause przy śladach audio i głosach
- Zastąpić `ActivityIndicator color="#e94560"` wersją z tokenem `accent.pearl` lub `accent.danger`
- Zachować całą logikę biznesową niezmienioną

**Non-Goals:**
- Nowe funkcjonalności (upload, OCR, TTS, udostępnianie)
- Zmiany API, schematów Prisma, typów shared
- Przepisanie logiki audio (polling, playback, offline cache)
- Dodanie animacji poza tym co już istnieje (`FadeZoomContent`)
- Zmiany w `packages/shared` lub `apps/api`

## Decisions

### 1. Użycie `audioFlowTokens` zamiast inline stałych

**Decyzja:** Wszystkie kolory, odstępy, promienie i typografia pobierane z `const t = audioFlowTokens` na początku pliku.

**Dlaczego:** Spójność z resztą aplikacji. Jedna zmiana tokenu propaguje się wszędzie. Granatowa paleta (`#16213e`, `#0f3460`) nie istnieje w `audioFlowTokens` — użycie jej byłoby rezyduem starego designu.

**Alternatywa odrzucona:** Zachowanie `StyleSheet.create` z nowymi kolorami jako literały — nadal tworzy rozsprzężenie z systemem designu.

### 2. `TopAppBar` zamiast własnego nagłówka

**Decyzja:** Każdy z trzech widoków dostaje `<TopAppBar title="..." leftSlot={<RoundIconButton />} />` z przyciskiem powrotu `router.back()`.

**Dlaczego:** `TopAppBar` to wyeksportowany komponent z `audioflow.tsx` — zapewnia spójną wysokość, safe-area i typ typografii. Obecne widoki mają surowy `<View style={styles.header}>` bez back navigation.

**Alternatywa odrzucona:** `AudioFlowTopChrome` — to niskopoziomowy wrapper, `TopAppBar` jest właściwym komponentem dla nagłówków z przyciskami.

### 3. `GlassPanel` dla kart list

**Decyzja:** Karty głosów, karty obrazków, karty audio, elementy listy udostępniania — wszystkie owrapowane w `<GlassPanel>` zamiast `backgroundColor: '#16213e'`.

**Dlaczego:** `GlassPanel` używa `rgba(45,30,30,0.45)` + `borderColor` z tokenów + blur — pasuje do tła `AudioFlowScreen`. Granatowe tło kart na burgundowym tle wygląda obco.

**Alternatywa odrzucona:** Zachowanie `View` z ręcznym `backgroundColor` z nowych tokenów — możliwe, ale `GlassPanel` jest gotowym komponentem z już zdefiniowanym efektem.

### 4. `PearlButton` / `GhostButton` dla CTA

**Decyzja:**
- Główne akcje (Wyślij zdjęcia, Generuj audio, Udostępnij) → `PearlButton`
- Drugorzędne akcje (Anuluj, Galeria, Aparat, Udostępnij link) → `GhostButton`
- Destrukcyjne akcje (Usuń, Odbierz) → `GhostButton` z `textStyle={{ color: t.color.accent.danger }}`

**Dlaczego:** `PearlButton` (#F0EAD6 gradient) zastępuje stare `#e94560` i `#06d6a0` CTA. `GhostButton` zastępuje `#0f3460` przyciski.

### 5. `AudioFlowTextField` w `sharing.tsx`

**Decyzja:** `TextInput` z `backgroundColor: '#16213e'` zastępujemy `AudioFlowTextField`.

**Dlaczego:** Pole email to jedyne wejście użytkownika w tym ekranie — gotowy komponent zapewnia spójność z formularzami logowania.

### 6. `RoundIconButton` dla play/pause

**Decyzja:** Przyciski `▶/⏸` w `voice.tsx` (preview głosu + playback audio track) używają `RoundIconButton` (size=40).

**Dlaczego:** `RoundIconButton` ma już `borderWidth`, `glassLight` background i pearl tint — lepszy efekt niż ręczny `backgroundColor: '#0f3460'`.

## Risks / Trade-offs

- [`GlassPanel` wrap kart w `FlatList`] → Potencjalny wpływ na wydajność renderowania przy długich listach. Mitygacja: `GlassPanel` to prosty `View` z blur — bez `Animated`, bez ciężkich efektów. Ryzyko niskie.
- [Usunięcie `StyleSheet.create`] → Inline style lub `StyleSheet` z tokenami obu działają. Mitygacja: zachowujemy `StyleSheet.create` z wartościami z tokenów (przez `const t = audioFlowTokens`).
- [Brak back navigation obecnie] → `TopAppBar` z `router.back()` dodaje nową interakcję. Mitygacja: `expo-router` automatycznie obsługuje to w stacku — ryzyko zerowe.

## Migration Plan

1. Zmiana jest czysto frontendowa w `apps/mobile` — brak migracji bazy, brak rollout strategy.
2. Weryfikacja: uruchomienie aplikacji na iOS Simulator + przejście przez wszystkie trzy ekrany.
3. Lint: `npm run lint` w workspace.
4. Nie ma potrzeby feature flag — zmiany są czysto wizualne.
