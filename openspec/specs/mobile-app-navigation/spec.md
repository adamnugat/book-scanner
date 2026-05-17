### Requirement: Stabilny pełny ekran przy wyłącznie wstecznej nawigacji

System (aplikacja mobilna Book Scanner) SHALL zapewniać, że przy **cofaniu się** w standardowym stosie nawigacji (expo-router / React Navigation Stack) użytkownik nie widzi zauważalnego „migania” ani jednoklatkowego przebłysku na **całym obszarze ekranu** (od góry do dołu), które sugerowałoby błędne renderowanie, nagłą zmianę tła lub **niespójną kompozycję sąsiednich widoków** podczas animacji przejścia wstecz. Wymaganie dotyczy **wyłącznie** nawigacji wstecz; nawigacja w przód jest poza zakresem tego wymagania. Stack nawigacji SHALL używać `animation: 'none'` jako ustawienia domyślnego — animacja ekranu jest delegowana do komponentu `FadeZoomContent` wewnątrz treści ekranu.

#### Scenario: Cofnięcie z podstrony projektu

- **WHEN** użytkownik znajduje się na dowolnym ekranie projektu (np. szczegóły projektu, zdjęcia, OCR, głos) i wykonuje akcję cofnięcia (gest lub przycisk wstecz) do poprzedniego ekranu w tym samym stosie
- **THEN** przejście jest wizualnie płynne na **całym ekranie**: żaden fragment viewportera (nagłówek, treść, dolna krawędź) nie przełącza się na kontrastującą warstwę ani pusty kolor na jedną widoczną klatkę w sposób zauważalny dla użytkownika

#### Scenario: Cofnięcie w innych częściach aplikacji

- **WHEN** użytkownik cofa się w obrębie flow uwierzytelniania (np. rejestracja lub reset hasła → logowanie) lub innych tras poza szczegółami projektu, o ile są w tym samym modelu stacka
- **THEN** obowiązują te same oczekiwania co w scenariuszu podstron projektu: brak zauważalnego pełnoekranowego flashu w trakcie animacji cofnięcia

#### Scenario: Nawigacja w przód z animacją fade-zoom treści

- **WHEN** użytkownik przechodzi **w przód** (`push`) między ekranami w obrębie `(app)`
- **THEN** obszar treści nowego ekranu pojawia się z animacją fade-in + zoom-in; header i footer pozostają bez animacji scale

#### Scenario: Spójne tło i kompozycja sceny przy cofaniu

- **WHEN** następuje animacja przejścia **wstecz** między ekranami w obrębie `(app)` lub `(auth)` z włączonym natywnym stackiem
- **THEN** tło i kompozycja widoczne na **całym ekranie** podczas animacji SHALL być spójne z ustalonym motywem aplikacji, bez nagłego błysku domyślnego jasnego tła lub sprzecznej warstwy, tak aby sąsiednie widoki nie tworzyły kontrastującej jednoklatkowej kompozycji na całym viewporcie

#### Scenario: Brak regresji semantyki nawigacji

- **WHEN** użytkownik przechodzi w przód i w tył po głównych ścieżkach: lista projektów → projekt → podstrona → cofnięcie
- **THEN** zachowanie nawigacji (historia, tytuły, przyciski wstecz) pozostaje zgodne z wcześniejszym modelem; zmiana dotyczy wyłącznie stabilności wizualnej **przy cofaniu**, a nie semantyki tras

### Requirement: AudioFlow top header

The mobile app SHALL use an AudioFlow-compatible top header on redesigned primary screens without changing route semantics.

#### Scenario: Dashboard shows brand header

- **WHEN** the authenticated dashboard is displayed
- **THEN** the screen shows a top header with AudioFlow brand treatment and accessible actions for available dashboard controls

#### Scenario: Auth screen hides native header

- **WHEN** the login screen is displayed
- **THEN** the native stack header remains hidden and the screen-owned AudioFlow layout provides the visible brand treatment

#### Scenario: Existing back navigation semantics remain unchanged

- **WHEN** the user navigates between existing app or auth routes
- **THEN** the route history, back behavior, and stack semantics remain consistent with the pre-redesign app

### Requirement: AudioFlow footer menu

Aplikacja mobilna SHALL zapewniać AudioFlow dolne menu nawigacyjne dla przeprojektowanych głównych ekranów. Na widoku dashboardu `/(app)` dolne menu SHALL zawierać wyłącznie centralny przycisk tworzenia — bez przycisków bocznych (Biblioteka, Odtwarzacz). Na pozostałych ekranach zachowanie SHALL pozostać bez zmian.

#### Scenario: Dashboard footer shows only create button

- **WHEN** uwierzytelniony dashboard `/(app)` jest wyświetlany
- **THEN** dolne menu zawiera wyłącznie centralny przycisk `+` (tworzenie nowego audiobooka)
- **THEN** przyciski „Biblioteka" i „Odtwarzacz" nie są renderowane ani widoczne

#### Scenario: Dashboard footer starts new audiobook

- **WHEN** użytkownik naciska centralny przycisk `+` w dolnym menu dashboardu
- **THEN** system nawiguje do istniejącej trasy `/(app)/projects/new`

#### Scenario: Footer na ekranach projektów zachowuje pełną strukturę

- **WHEN** użytkownik jest na ekranie projektu (np. szczegóły, zdjęcia, głos)
- **THEN** dolne menu zachowuje pełną strukturę z trzema przyciskami zgodnie z wcześniejszym zachowaniem

#### Scenario: Footer respects safe area and content

- **WHEN** dolne menu jest renderowane na urządzeniu mobilnym
- **THEN** treść ekranu ma wystarczający padding dolny żeby menu nie zasłaniało klikalnej zawartości dashboardu
