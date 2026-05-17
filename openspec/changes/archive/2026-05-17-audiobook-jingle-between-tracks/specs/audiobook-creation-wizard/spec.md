## MODIFIED Requirements

### Requirement: AudioFlow styling for project setup step

The audiobook creation wizard SHALL render the project setup step using the AudioFlow mobile design system while presenting local bundled jingle presets as selectable options, and without fetching interstitial presets from the backend API.

#### Scenario: User opens project setup step

- **WHEN** the user navigates to `projects/new/index`
- **THEN** the screen presents the AudioFlow burgundy ambient background, glass surfaces, glow headline treatment, and pearl-accented primary action based on `design-system/reference-views/New Project.html`

#### Scenario: User configures project basics

- **WHEN** the user enters a title and selects language, voice, and jingle preset
- **THEN** the jingle picker SHALL display options from `LOCAL_JINGLES` (local:page-turn-1, local:page-turn-2, local:page-turn-3) without making a network request to `/interstitial-presets`
- **AND** each option SHALL display its `icon` emoji alongside the label — `🔔` for page-turn-1 and page-turn-2, `🎙️` for page-turn-3
- **AND** the screen SHALL preserve the existing validation, voice API loading states, selected values, and project creation request behavior

#### Scenario: Icon differentiates jingle types

- **WHEN** the user views the jingle picker
- **THEN** `local:page-turn-1` and `local:page-turn-2` SHALL display a sound icon (e.g. `🔔`) and `local:page-turn-3` SHALL display a voice/microphone icon (e.g. `🎙️`)

#### Scenario: Jingle preset sent to backend

- **WHEN** the user submits the project creation form with a local jingle selected
- **THEN** the `interstitialPreset` field in the create-project request SHALL be the `name` value from `LOCAL_JINGLES` (e.g. `'local:page-turn-1'`)

#### Scenario: Options fail to load

- **WHEN** voice loading fails (note: jingle options are local and cannot fail to load)
- **THEN** the screen SHALL preserve the existing error feedback behavior while presenting the error state within the AudioFlow visual language
