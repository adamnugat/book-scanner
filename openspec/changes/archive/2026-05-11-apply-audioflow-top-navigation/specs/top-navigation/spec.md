## ADDED Requirements

### Requirement: Global Top Navigation layout
Aplikacja MUST renderować ujednolicony pasek górnej nawigacji na ekranach opartych o Expo Router, który domyślnie zawiera przycisk powrotu po lewej stronie (jeśli to możliwe), tytuł strony na środku oraz przycisk menu po prawej stronie.

#### Scenario: Default screen navigation
- **WHEN** użytkownik wchodzi na dowolny podrzędny ekran (np. cennik, szczegóły projektu)
- **THEN** system renderuje na górze pasek z tytułem ekranu na środku, przyciskiem "Wstecz" po lewej stronie i przyciskiem menu (hamburger/dots) po prawej stronie

### Requirement: Top Navigation Exceptions
System MUST ukrywać lub modyfikować górną nawigację w specyficznych, zdefiniowanych przypadkach (Logowanie, Dashboard).

#### Scenario: Login screen
- **WHEN** użytkownik znajduje się na ekranie logowania
- **THEN** system ukrywa całkowicie górny pasek nawigacyjny

#### Scenario: Dashboard screen
- **WHEN** użytkownik znajduje się na głównym ekranie Dashboardu
- **THEN** system wyświetla na środku logo i nazwę aplikacji zamiast tytułu
- **THEN** system ukrywa przycisk "Wstecz" po lewej stronie
- **THEN** system wciąż wyświetla przycisk menu po prawej stronie

### Requirement: Global Navigation Menu
System MUST wyświetlać rozwijane menu lub modal po kliknięciu w prawy przycisk nagłówka, zawierające zdefiniowane globalne akcje.

#### Scenario: Opening global menu
- **WHEN** użytkownik klika przycisk menu w prawym górnym rogu
- **THEN** system otwiera listę opcji zawierającą pozycje "Cennik" oraz "Wyloguj"

#### Scenario: Logout from menu
- **WHEN** użytkownik wybiera opcję "Wyloguj" z globalnego menu
- **THEN** system wylogowuje użytkownika i przekierowuje go do ekranu logowania
