## ADDED Requirements

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

### Requirement: Dashboard filters and sorting
The mobile app SHALL preserve existing dashboard filtering and sorting while restyling the controls with AudioFlow primitives.

#### Scenario: User filters projects
- **WHEN** the user selects a project status filter
- **THEN** the dashboard filters the list using the existing status logic and marks the selected filter with AudioFlow selected styling

#### Scenario: User sorts projects
- **WHEN** the user selects date, title, or status sorting
- **THEN** the dashboard sorts the list using the existing sort logic and marks the selected sort option with AudioFlow selected styling

#### Scenario: Filter returns no matching projects
- **WHEN** projects exist but the selected filter has no matching results
- **THEN** the dashboard shows an AudioFlow empty-filter state with an action to return to all projects

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
