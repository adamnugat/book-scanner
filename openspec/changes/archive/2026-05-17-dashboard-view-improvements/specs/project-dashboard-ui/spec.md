## MODIFIED Requirements

### Requirement: Last Played Audiobook Widget

System SHALL wyświetlać widget dla ostatnio zmodyfikowanego/odtwarzanego audiobooka na górze dashboardu. Widget SHALL natychmiast znikać gdy lista projektów jest pusta — w tym gdy ostatni projekt zostanie usunięty lokalnie przed ponownym pobraniem z API.

#### Scenario: Użytkownik ma co najmniej jeden projekt

- **WHEN** uwierzytelniony użytkownik ma projekty na dashboardzie
- **THEN** system wyświetla najnowszy projekt w widocznym widgecie „Ostatnio odtwarzane"
- **THEN** widget zawiera tytuł projektu, przycisk play i pasek postępu
- **THEN** naciśnięcie przycisku play otwiera odtwarzacz dla tego projektu

#### Scenario: Użytkownik nie ma projektów

- **WHEN** uwierzytelniony użytkownik nie ma żadnych projektów
- **THEN** widget „Ostatnio odtwarzane" nie jest wyświetlany

#### Scenario: Użytkownik usuwa ostatni projekt

- **WHEN** użytkownik usuwa jedyny pozostały projekt z dashboardu
- **THEN** widget „Ostatnio odtwarzane" znika natychmiast po lokalnej aktualizacji stanu listy projektów
- **THEN** widget nie wyświetla linku do usuniętego projektu w żadnym momencie po potwierdzeniu usunięcia

### Requirement: Dashboard project actions

The mobile app SHALL preserve existing project actions after the dashboard visual refactor.

#### Scenario: User opens project

- **WHEN** the user presses a project card
- **THEN** the system navigates to that project's details route using the existing route shape

#### Scenario: User deletes project

- **WHEN** the user chooses to delete a project from the dashboard
- **THEN** the system preserves the existing confirmation, API deletion, list update, and toast feedback behavior

#### Scenario: User opens pricing or logs out

- **WHEN** the user uses dashboard header actions for pricing or logout
- **THEN** the system preserves the existing pricing navigation and logout behavior
