## Context

Aplikacja mobilna wymaga ujednolicenia górnej nawigacji (Header/Top Navigation) we wszystkich ekranach w oparciu o Expo Router. Obecnie różne ekrany mogą posiadać niespójne nagłówki lub polegać na domyślnych, natywnych nagłówkach Expo Router bez odpowiedniej stylizacji. Wprowadzenie nowego design systemu wymusza konkretny, ustandaryzowany układ dla nawigacji (lewa strona: powrót, środek: tytuł, prawa strona: przycisk menu).

## Goals / Non-Goals

**Goals:**
- Stworzenie ujednoliconego, customowego komponentu nagłówka (`Header` / `TopNavigation`) dla Expo Router, który zostanie wdrożony we wszystkich wymaganych widokach.
- Zaimplementowanie ujednoliconego menu nawigacyjnego (np. jako rozwijane menu lub bottom sheet) uruchamianego z poziomu nagłówka, oferującego pozycje "Cennik" oraz "Wyloguj".
- Zapewnienie poprawnej obsługi wyjątków widoków (Dashboard: własny układ środkowy z logo, brak przycisku powrotu; Logowanie: całkowicie ukryty nagłówek).

**Non-Goals:**
- Jakiekolwiek modyfikacje na backendzie (API), zmiany struktury bazy danych.
- Implementacja logiki biznesowej Cennika (tylko nawigacja do niego).
- Zmiany w istniejącej logice uwierzytelniania i sesji (tylko użycie funkcji wylogowania).

## Decisions

- **Customowy Header dla Expo Router**: Zamiast opierać się na natywnym nagłówku (`headerShown: true` bez customizacji), w pliku `app/_layout.tsx` (i ewentualnie layoutach podrzędnych) zdefiniujemy własny komponent `header`, który przyjmie opcje routera (np. tytuł ekranu).
- **Zarządzanie wyjątkami**:
  - `(auth)/login.tsx`: wykorzystamy `options={{ headerShown: false }}`.
  - `(app)/index.tsx` (Dashboard): przekażemy do opcji ekranu dedykowane parametry (np. `headerTitle: () => <Logo />`, wyłączenie przycisku wstecz przez `headerLeft: () => null`), albo zaimplementujemy te warunki wewnątrz customowego nagłówka bazując na aktualnej trasie.
- **Menu (Dropdown/Sheet)**: Kliknięcie przycisku "Menu" po prawej stronie otworzy prosty modal lub React Native Modal / Bottom Sheet zawierający listę opcji. Zmniejsza to złożoność w porównaniu do pełnego Drawera, który mógłby kolidować z nawigacją stosu.
- **Bezpieczeństwo UI**: Nagłówek będzie używać `useSafeAreaInsets` z `react-native-safe-area-context` dla odpowiedniego wyświetlania na urządzeniach z Notch / Dynamic Island na iOS oraz różnymi paskami powiadomień w systemie Android.

## Risks / Trade-offs

- **Zarządzanie stosem nawigacji (powrót)** -> Ryzyko błędnego przycisku wstecz tam, gdzie nie powinien się znaleźć. Łagodzenie: wykorzystamy wbudowane `router.canGoBack()` oraz dodatkowe manualne ukrywanie dla wybranych głównych ekranów (Dashboard).
- **Nakładanie się elementów z SafeArea** -> Zastosujemy rygorystyczne paddingi od góry dla komponentu nagłówka.
