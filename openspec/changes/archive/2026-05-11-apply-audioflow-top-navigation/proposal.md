## Why

Wdrażamy AudioFlow design system. Po aktualizacji ekranów logowania, dashboardu oraz widoków projektu, nadszedł czas na ujednolicenie górnego paska nawigacji (Top Navigation/Header) w całej aplikacji mobilnej, aby zapewnić spójność wizualną i funkcjonalną oraz poprawić User Experience zgodnie z referencjami w `design-system/reference-views/`.

## What Changes

- Wdrożenie nowego, ujednoliconego górnego paska nawigacji we wszystkich widokach aplikacji opartych o Expo Router.
- **Domyślny układ nawigacji**:
  - Po lewej stronie: przycisk powrotu (wstecz).
  - Na środku: tytuł aktualnej strony/zakładki.
  - Po prawej stronie: przycisk menu (otwierający globalne menu nawigacyjne).
- **Wyjątki**:
  - **Dashboard**: Zamiast tytułu na środku znajduje się logo i nazwa aplikacji. Z widoku usunięty zostanie widoczny wcześniej adres e-mail zalogowanego użytkownika. Brak przycisku powrotu po lewej stronie.
  - **Logowanie**: Całkowity brak górnego paska nawigacyjnego (widok czysty).
- **Globalne Menu Nawigacyjne**: Będzie zawierać docelowo dwie główne pozycje: "Cennik" oraz "Wyloguj".
- Zmiany te dotyczą tylko warstwy UI i struktury nawigacji w `apps/mobile`, bez ingerencji w API.

## Capabilities

### New Capabilities
- `top-navigation`: Wdrożenie globalnego paska nawigacji w aplikacji opartej na Expo Router (zgodnie z nowym design systemem AudioFlow) oraz stworzenie ujednoliconego rozwijanego menu nawigacyjnego z opcjami "Cennik" i "Wyloguj".

### Modified Capabilities

## Impact

- **apps/mobile**: Zmiany w plikach konfiguracyjnych układów (np. `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(app)/_layout.tsx`), stworzenie dedykowanych komponentów dla nagłówka (Header) oraz menu w `components/`. Wpływ na nagłówki we wszystkich istniejących i nowo tworzonych ekranach.
- Zmiany są ograniczone wyłącznie do UI w `apps/mobile`. 
- **Non-goals**: Brak jakichkolwiek modyfikacji w backendzie (`apps/api`), modelach Prisma, płatnościach, strukturze autoryzacji czy integracjach zewnętrznych (OCR/TTS).