## MODIFIED Requirements

### Requirement: Stabilny pełny ekran przy wyłącznie wstecznej nawigacji

System (aplikacja mobilna Book Scanner) SHALL zapewniać, że przy **cofaniu się** w standardowym stosie nawigacji (expo-router / React Navigation Stack) użytkownik nie widzi zauważalnego „migania" ani jednoklatkowego przebłysku na **całym obszarze ekranu** (od góry do dołu), które sugerowałoby błędne renderowanie, nagłą zmianę tła lub **niespójną kompozycję sąsiednich widoków** podczas animacji przejścia wstecz. Wymaganie dotyczy **wyłącznie** nawigacji wstecz; nawigacja w przód jest poza zakresem tego wymagania. Stack nawigacji SHALL używać `animation: 'none'` jako ustawienia domyślnego — animacja ekranu jest delegowana do komponentu `FadeZoomContent` wewnątrz treści ekranu.

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
- **THEN** zachowanie nawigacji (historia, tytuły, przyciski wstecz) pozostaje zgodne z wcześniejszym modelem; zmiana dotyczy wyłącznie animacji wizualnej, a nie semantyki tras
