## MODIFIED Requirements

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

## ADDED Requirements

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
