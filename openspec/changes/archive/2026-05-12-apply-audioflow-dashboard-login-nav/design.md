## Context

Aplikacja mobilna przechodzi proces wdrażania nowego systemu wizualnego (AudioFlow). W poprzednich iteracjach zaktualizowano widoki tworzenia projektu. Obecnie celem jest wdrożenie nowego designu dla ekranu logowania, dashboardu, widoku szczegółów projektu oraz ujednolicenie nawigacji (header i footer) w całej aplikacji. Zmiany obejmują wyłącznie warstwę prezentacji (UI) w aplikacji mobilnej, bez modyfikacji po stronie API, bazy danych czy logiki biznesowej.

## Goals / Non-Goals

**Goals:**
- Wdrożenie nowego wyglądu ekranu logowania (`apps/mobile/app/(auth)/login.tsx`).
- Przebudowa Dashboardu (`apps/mobile/app/(app)/index.tsx`), usunięcie filtrów i sortowania, dodanie sekcji "Ostatnio odtwarzane" z odtwarzaczem.
- Wdrożenie nowego wyglądu dla szczegółów projektu (`apps/mobile/app/(app)/projects/[id]/index.tsx`), ze szczególnym uwzględnieniem górnego kontenera odtwarzacza.
- Ujednolicenie globalnej nawigacji (header i footer) w aplikacji przy użyciu komponentów z `audioflow.tsx`.
- Wykorzystanie istniejących komponentów z `apps/mobile/components/audioflow.tsx` i wzorców z `design-system/reference-views/`.

**Non-Goals:**
- Zmiany w logice autoryzacji, API, OCR, TTS.
- Zmiany w strukturze bazy danych.
- Implementacja nowej funkcjonalności odtwarzacza (wykorzystujemy istniejącą logikę, zmieniamy tylko UI).

## Decisions

1. **Użycie komponentów AudioFlow**: Wszystkie nowe widoki będą budowane przy użyciu komponentów zdefiniowanych w `apps/mobile/components/audioflow.tsx` (np. `Box`, `Text`, `Button`, `IconButton`, `Input`).
2. **Globalna Nawigacja**: 
   - Zostanie utworzony nowy komponent `AudioFlowTopNavigation` (Header) oraz `AudioFlowBottomNavigation` (Footer).
   - Komponenty te zostaną zintegrowane w głównym layoucie aplikacji (`apps/mobile/app/(app)/_layout.tsx`).
3. **Dashboard (Ostatnio odtwarzane)**:
   - Zamiast skomplikowanych filtrów, na górze dashboardu pojawi się widżet ostatnio odtwarzanego audiobooka.
   - Stan odtwarzacza (progress, play/pause) będzie podłączony do istniejącego kontekstu odtwarzacza (jeśli istnieje) lub zamockowany na potrzeby UI, jeśli logika jeszcze nie pozwala na globalny dostęp.
4. **Szczegóły projektu**:
   - Przebudowa widoku tak, aby górna część ekranu stanowiła duży kontener odtwarzacza, zgodnie z nowym designem.
   - Zastąpienie standardowych list komponentami z `audioflow.tsx`.

## Risks / Trade-offs

- **Ryzyko**: Globalny odtwarzacz na Dashboardzie może wymagać dostępu do stanu odtwarzania, który obecnie może być ograniczony tylko do widoku szczegółów projektu.
  - **Mitygacja**: Jeśli stan odtwarzacza nie jest wyciągnięty wystarczająco wysoko w drzewie komponentów, na tym etapie skupimy się na UI, a ewentualny refactoring stanu odłożymy na osobną iterację, lub zaimplementujemy prosty dostęp do ostatniego projektu.
- **Ryzyko**: Zmiana globalnego layoutu (header/footer) może wpłynąć na widoki, które jeszcze nie zostały zaktualizowane do nowego design systemu.
  - **Mitygacja**: Upewnimy się, że nowy layout jest na tyle elastyczny, że stare widoki nadal będą w nim poprawnie renderowane (np. odpowiednie marginesy/paddingi).
