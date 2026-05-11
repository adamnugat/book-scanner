## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Dashboard filters and sorting
**Reason**: Replaced by a simpler UI focusing on the last played audiobook and a clean list of projects.
**Migration**: Remove filter and sort UI components from the Dashboard.

## ADDED Requirements

### Requirement: Last Played Audiobook Widget
The system SHALL display a widget for the most recently played or modified audiobook at the top of the dashboard, replacing the previous filters and sorting controls.

#### Scenario: User has at least one project
- **WHEN** the authenticated user has projects on the dashboard
- **THEN** the system displays the most recent project in a prominent "Ostatnio odtwarzane" widget
- **THEN** the widget includes the project title, a play button, and a progress bar
- **THEN** pressing the play button opens the player for that project

#### Scenario: User has no projects
- **WHEN** the authenticated user has no projects
- **THEN** the "Ostatnio odtwarzane" widget is not displayed
