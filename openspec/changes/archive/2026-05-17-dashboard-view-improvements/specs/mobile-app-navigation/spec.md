## MODIFIED Requirements

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
