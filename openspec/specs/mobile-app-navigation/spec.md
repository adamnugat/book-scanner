### Requirement: Stabilny pełny ekran przy wyłącznie wstecznej nawigacji

System (aplikacja mobilna Book Scanner) SHALL zapewniać, że przy **cofaniu się** w standardowym stosie nawigacji (expo-router / React Navigation Stack) użytkownik nie widzi zauważalnego „migania” ani jednoklatkowego przebłysku na **całym obszarze ekranu** (od góry do dołu), które sugerowałoby błędne renderowanie, nagłą zmianę tła lub **niespójną kompozycję sąsiednich widoków** podczas animacji przejścia wstecz. Wymaganie dotyczy **wyłącznie** nawigacji wstecz; nawigacja w przód jest poza zakresem tego wymagania.

#### Scenario: Cofnięcie z podstrony projektu

- **WHEN** użytkownik znajduje się na dowolnym ekranie projektu (np. szczegóły projektu, zdjęcia, OCR, głos) i wykonuje akcję cofnięcia (gest lub przycisk wstecz) do poprzedniego ekranu w tym samym stosie
- **THEN** przejście jest wizualnie płynne na **całym ekranie**: żaden fragment viewportera (nagłówek, treść, dolna krawędź) nie przełącza się na kontrastującą warstwę ani pusty kolor na jedną widoczną klatkę w sposób zauważalny dla użytkownika

#### Scenario: Cofnięcie w innych częściach aplikacji

- **WHEN** użytkownik cofa się w obrębie flow uwierzytelniania (np. rejestracja lub reset hasła → logowanie) lub innych tras poza szczegółami projektu, o ile są w tym samym modelu stacka
- **THEN** obowiązują te same oczekiwania co w scenariuszu podstron projektu: brak zauważalnego pełnoekranowego flashu w trakcie animacji cofnięcia

#### Scenario: Nawigacja w przód bez regresji

- **WHEN** użytkownik przechodzi **w przód** (`push`) między ekranami w obrębie `(app)` lub `(auth)`
- **THEN** zachowanie wizualne pozostaje co najmniej tak dobre jak przed zmianą; niniejsze wymaganie **nie wymusza** nowych kryteriów jakości dla animacji w przód poza brakiem regresji

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

The mobile app SHALL provide an AudioFlow bottom footer menu for redesigned primary app screens.

#### Scenario: Dashboard footer shows library state

- **WHEN** the authenticated dashboard is displayed
- **THEN** the footer menu shows the library/dashboard destination as active

#### Scenario: Dashboard footer starts new audiobook

- **WHEN** the user presses the raised pearl footer action
- **THEN** the system navigates to the existing new audiobook route `/(app)/projects/new`

#### Scenario: Footer avoids invalid project routes

- **WHEN** a footer menu destination would require a concrete project id that is not available
- **THEN** the footer menu does not navigate to a placeholder or invalid project route

#### Scenario: Footer respects safe area and content

- **WHEN** the footer menu is rendered on a mobile device
- **THEN** the screen content leaves enough bottom padding so the footer does not cover tappable dashboard content
