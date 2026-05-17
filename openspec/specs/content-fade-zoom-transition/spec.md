### Requirement: FadeZoomContent animuje obszar treści przy wejściu

Aplikacja mobilna SHALL udostępniać komponent `FadeZoomContent`, który podczas montowania uruchamia animację fade-in (opacity 0→1) połączoną z efektem zoom-in (scale 0.95→1.0) w czasie ~200ms z wygaszaniem `Easing.out(Easing.ease)`. Komponent przekazuje `flex: 1` do swojego kontenera i renderuje children bez dodatkowych ograniczeń layoutu.

#### Scenario: Animacja fade-in z zoomem przy nawigacji w przód

- **WHEN** użytkownik przechodzi do nowego ekranu (push) i ekran się montuje
- **THEN** obszar treści ekranu (zawartość wewnątrz `FadeZoomContent`) stopniowo pojawia się z lekkim powiększeniem od 95% do 100% przez ~200ms

#### Scenario: Animacja nie blokuje interakcji

- **WHEN** animacja fade-in+zoom jest w toku
- **THEN** elementy interaktywne wewnątrz `FadeZoomContent` są dostępne po zakończeniu animacji; w trakcie animacji pointer events mogą być ograniczone

#### Scenario: Komponent nie wpływa na layout dzieci

- **WHEN** `FadeZoomContent` renderuje dowolny układ jako children
- **THEN** rozmiar i pozycja elementów wewnątrz są identyczne jak bez wrappera — komponent nie dodaje marginesów, paddingów ani dodatkowych kolorów tła

### Requirement: Górny pasek i dolne menu nie skalują się podczas przejścia

Aplikacja mobilna SHALL zapewnić, że `AudioFlowTopNavigation` (header) oraz `AudioFlowBottomNavigation` / `AudioFlowFooterMenu` (footer) nie są objęte animacją scale podczas przejść między ekranami. Dopuszczalne jest nieanimowane pojawienie się nowej treści headera.

#### Scenario: Header nie porusza się podczas przejścia treści

- **WHEN** użytkownik przechodzi między ekranami a zawartość ekranu wykonuje animację fade-zoom
- **THEN** górny pasek nawigacyjny pozostaje nieruchomy — nie przesuwa się, nie zmienia rozmiaru, nie zmienia opacity

#### Scenario: Footer nie skaluje się podczas przejścia treści

- **WHEN** użytkownik przechodzi między ekranami a zawartość ekranu wykonuje animację fade-zoom
- **THEN** dolne menu nawigacyjne (`AudioFlowBottomNavigation` / `AudioFlowFooterMenu`) pozostaje nieruchome — nie przesuwa się, nie skaluje, nie zmienia opacity

#### Scenario: Brak regresji przy nawigacji wstecz

- **WHEN** użytkownik cofa się do poprzedniego ekranu
- **THEN** przejście wstecz jest wizualnie płynne i nie powoduje zauważalnego flashu na headerze ani footerze
