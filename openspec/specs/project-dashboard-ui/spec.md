### Requirement: Dynamic Dashboard States

The system SHALL display the project details screen in one of two distinct AudioFlow states based on the presence of generated audio tracks.

#### Scenario: Project has audio tracks (Consumption State)

- **WHEN** the project has at least one audio track (`api.getAudioTracks` returns array length > 0)
- **THEN** the system displays a prominent AudioFlow top hero-player container occupying the primary top area of the screen
- **THEN** the hero-player displays project artwork or an AudioFlow cover placeholder, readable overlay, status treatment, project title, available project metadata, a glass progress panel, and accessible transport controls
- **THEN** the primary play action opens the existing project player route using the current route shape
- **THEN** the system displays project tools in a glass grid layout below the hero-player

#### Scenario: Project has no audio tracks (Creation State)

- **WHEN** the project has zero audio tracks
- **THEN** the system displays an AudioFlow next-step panel at the top of the screen instead of an enabled player
- **THEN** the next-step panel preserves the existing status-specific guidance for preparing text or generating audio
- **THEN** the system displays project tools in a glass grid layout below the next-step panel

### Requirement: AudioFlow project detail shell

The mobile app SHALL present the project details screen using the AudioFlow shell while preserving existing project behavior.

#### Scenario: Project detail renders AudioFlow shell

- **WHEN** an authenticated user opens `/(app)/projects/[id]`
- **THEN** the screen displays the AudioFlow background, custom top bar with back and project options actions, Project Details content, and bottom footer menu without exposing the old dark-blue screen treatment

#### Scenario: Footer menu uses existing routes

- **WHEN** the Project Details footer menu is rendered
- **THEN** the library action navigates to `/(app)`, the central creation action navigates to `/(app)/projects/new`, and the player action stays on or opens the current project's existing player route without requiring a new route

### Requirement: Project detail data and actions remain unchanged

The mobile app SHALL preserve the existing Project Details data loading, project actions, and navigation behavior while changing the visual presentation.

#### Scenario: Project data loads from existing API

- **WHEN** the Project Details screen loads
- **THEN** it uses the existing project and audio-track fetching behavior to determine the screen state

#### Scenario: User opens project tools

- **WHEN** the user selects page photos, voice/audio, or sharing from the Project Details tool grid
- **THEN** the system navigates to the existing route for that tool using the current project id

#### Scenario: User manages project options

- **WHEN** the user opens the project options action
- **THEN** the system preserves the existing edit and delete project actions, including destructive confirmation behavior

### Requirement: Context Menu for Management Actions

The system SHALL move destructive and management actions out of the main view to prevent accidental clicks and declutter the interface.

#### Scenario: Accessing project settings

- **WHEN** the user taps the settings/more icon in the navigation header
- **THEN** the system presents a menu or action sheet containing "Edit Project" and "Delete Project" options

### Requirement: AudioFlow project library dashboard

The mobile app SHALL present the authenticated project library dashboard using the AudioFlow visual language while preserving existing project list behavior.

#### Scenario: Dashboard renders AudioFlow shell

- **WHEN** an authenticated user opens `/(app)`
- **THEN** the screen displays the AudioFlow background, top brand header, dashboard welcome section, project library content, and bottom footer menu

#### Scenario: Projects load from existing API

- **WHEN** the dashboard loads projects
- **THEN** it uses the existing project fetching behavior and renders the returned projects as AudioFlow glass project cards

#### Scenario: Dashboard loading state remains available

- **WHEN** project data is loading
- **THEN** the dashboard shows a loading state that is visually compatible with AudioFlow and does not expose the old dark-blue screen treatment

#### Scenario: Dashboard empty state remains actionable

- **WHEN** the authenticated user has no projects
- **THEN** the dashboard shows an AudioFlow empty state with a clear action to create a new audiobook

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

### Requirement: Etykiety i komunikaty dashboardu używają terminu „audiobook"
Dashboard SHALL używać terminu „audiobook" (i jego odmian) we wszystkich etykietach pasków użycia, komunikatach alertów, tekstach pustych stanów i przyciskach akcji.

#### Scenario: Pasek użycia na dashboardzie
- **WHEN** użytkownik otwiera dashboard lub menu nawigacyjne
- **THEN** pasek użycia SHALL wyświetlać etykietę „Audiobooki" (nie „Projekty")

#### Scenario: Komunikat pustego stanu
- **WHEN** użytkownik nie ma żadnych audiobooków
- **THEN** ekran SHALL wyświetlać tekst „Nie masz jeszcze żadnych audiobooków"

#### Scenario: Komunikaty alertów operacji
- **WHEN** operacja pobrania, usunięcia lub tworzenia audiobooka zakończy się błędem
- **THEN** treść alertu SHALL używać słowa „audiobook" w odpowiedniej formie gramatycznej (np. „Nie udało się pobrać audiobooka", „Nie udało się usunąć audiobooka")

#### Scenario: Chip limitu planu
- **WHEN** użytkownik przegląda ekran cennika
- **THEN** chip limitu SHALL wyświetlać „N audiobooków" (nie „N projektów")
