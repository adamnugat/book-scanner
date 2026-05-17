## Why

Widok dashboardu zawiera trzy problemy UX: sekcja „Ostatnio odtwarzane" może wskazywać na usunięty projekt, okładki projektów bez własnego zdjęcia wyświetlają emoji `📖` niezgodne z design systemem, a dolne menu nawigacyjne na dashboardzie zawiera przyciski, które nie mają sensu w tym kontekście (Biblioteka, Odtwarzacz). Zmiany poprawiają spójność wizualną i eliminują błędy nawigacji.

## What Changes

- **Sekcja „Ostatnio odtwarzane"**: po usunięciu ostatniego projektu (lub projektu powiązanego z sekcją) sekcja natychmiast znika i nie linkuje do nieistniejącego zasobu.
- **Okładki projektów**: zastąpienie emoji `📖` losową teksturą SVG (generowaną deterministycznie na podstawie `project.id`) wybraną z puli 10 wzorów graficznych (koła, kwadraty, fale, cienie, inne kształty) zintegrowanych z paletą design systemu AudioFlow.
- **Dolne menu nawigacyjne na dashboardzie**: usunięcie przycisków „Biblioteka" i „Odtwarzacz" — na dashboardzie widoczny jest wyłącznie centralny przycisk `+` (tworzenie nowego audiobooka). Zmiana dotyczy **tylko** widoku `/(app)`.

## Capabilities

### New Capabilities

- `project-card-texture`: Deterministyczny generator tekstur SVG dla okładek projektów; zwraca jeden z 10 wzorów na podstawie hash `project.id`; kolory z palety `audioFlowTokens`.

### Modified Capabilities

- `project-dashboard-ui`: Zmiana wymagań dotyczących sekcji „Ostatnio odtwarzane" (reset po usunięciu projektu) oraz widoczności dolnego menu nawigacyjnego na dashboardzie.
- `mobile-app-navigation`: Zmiana wymagań dotyczących struktury dolnego menu — na dashboardzie wyłącznie centralny przycisk; pozostałe ekrany bez zmian.

## Impact

- `apps/mobile/components/audioflow.tsx` — `ProjectCard`, `AudioFlowFooterMenu`
- `apps/mobile/app/(app)/index.tsx` — logika sekcji „Ostatnio odtwarzane", przekazywanie propsów do `AudioFlowBottomNavigation`
- Nowy plik: `apps/mobile/components/ProjectCoverTexture.tsx`
- Testy: `apps/mobile/__tests__/` — nowe testy dla tekstur, aktualizacja testów dashboardu i nawigacji
- Zakres weryfikacji: `npm run test:mobile`, `npm run lint`
