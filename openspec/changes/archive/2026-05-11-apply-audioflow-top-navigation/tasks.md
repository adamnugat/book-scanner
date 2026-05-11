## 1. Komponenty UI (Header & Menu)

- [x] 1.1 Zaimplementowanie ujednoliconego komponentu nagłówka (`TopNavigation` / `Header`) w `apps/mobile/components/` zawierającego lewy przycisk powrotu, środkowy tytuł (lub element customowy) i prawy przycisk menu.
- [x] 1.2 Zaimplementowanie rozwijanego menu / bottom sheet (`NavigationMenu`) uruchamianego przyciskiem z nagłówka, wyświetlającego pozycje "Cennik" oraz "Wyloguj".
- [x] 1.3 Integracja akcji "Wyloguj" w menu z istniejącym systemem auth w aplikacji mobilnej.
- [x] 1.4 Dodanie obsługi SafeArea w nowo utworzonych komponentach nagłówka.

## 2. Konfiguracja Expo Router

- [x] 2.1 Zastąpienie domyślnego nagłówka w `apps/mobile/app/_layout.tsx` (lub layoutach podrzędnych) stworzonym komponentem nawigacji używając opcji `header`.
- [x] 2.2 Ustawienie wyjątków dla ekranu Logowania (`apps/mobile/app/(auth)/login.tsx`) poprzez `headerShown: false`.
- [x] 2.3 Ustawienie wyjątków dla Dashboardu (`apps/mobile/app/(app)/index.tsx`): podmiana środkowego elementu na logo aplikacji i zablokowanie przycisku "Wstecz".

## 3. Testy i Weryfikacja

- [x] 3.1 Przetestowanie nawigacji pomiędzy Dashboardem, ustawieniami/projektem a Cennikiem pod kątem poprawnego renderowania nagłówka i działania przycisku Wstecz.
- [x] 3.2 Przetestowanie widoku Logowania pod kątem ukrycia nagłówka.
- [x] 3.3 Sprawdzenie funkcjonalności otwierania menu, nawigacji do "Cennik" i poprawnego działania "Wyloguj".
- [x] 3.4 Uruchomienie `npm run lint` i `npm run format:check` by sprawdzić formatowanie i błędy lintera.
