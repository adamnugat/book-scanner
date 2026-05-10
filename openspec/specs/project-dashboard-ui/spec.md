### Requirement: Dynamic Dashboard States

The system SHALL display the project details screen in one of two distinct states based on the presence of generated audio tracks.

#### Scenario: Project has audio tracks (Consumption State)

- **WHEN** the project has at least one audio track (`api.getAudioTracks` returns array length > 0)
- **THEN** the system displays a large cover image occupying the top 50% of the screen height and 100% of the screen width
- **THEN** the system displays a prominent "Play" button overlaid at the bottom of the cover image
- **THEN** the system displays project tools (Images, Voice, Share) in a grid layout below the cover

#### Scenario: Project has no audio tracks (Creation State)

- **WHEN** the project has zero audio tracks
- **THEN** the system displays the "Next Step" card at the top of the screen instead of the large cover image
- **THEN** the system displays project tools in a grid layout below the "Next Step" card

### Requirement: Context Menu for Management Actions

The system SHALL move destructive and management actions out of the main view to prevent accidental clicks and declutter the interface.

#### Scenario: Accessing project settings

- **WHEN** the user taps the settings/more icon in the navigation header
- **THEN** the system presents a menu or action sheet containing "Edit Project" and "Delete Project" options
