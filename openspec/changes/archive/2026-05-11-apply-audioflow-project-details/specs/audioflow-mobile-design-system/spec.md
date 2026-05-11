## ADDED Requirements

### Requirement: AudioFlow project detail player primitives

The mobile app SHALL provide reusable AudioFlow primitives or style helpers for the Project Details top player container.

#### Scenario: Screen composes hero player

- **WHEN** a mobile screen needs the Project Details hero player
- **THEN** it can render a burgundy/glass cover container with readable overlay, project status treatment, title metadata, a glass player panel, a pearl primary play control, and accessible transport controls

#### Scenario: Screen renders player progress

- **WHEN** a mobile screen needs to show playback or audiobook progress inside the Project Details hero
- **THEN** it can render an AudioFlow progress treatment with pearl fill, muted track, readable time labels, and graceful fallback values when exact progress is unavailable

### Requirement: AudioFlow project tool tile primitives

The mobile app SHALL provide reusable AudioFlow styling for square project tool tiles used below the Project Details hero.

#### Scenario: Screen renders project tool tile

- **WHEN** a mobile screen needs a navigation tile for project tools such as page photos, voice/audio, sharing, or export
- **THEN** it can render a glass tile with an icon area, optional meta label, title, body copy, rounded corners, border treatment, and press feedback matching the AudioFlow reference views

#### Scenario: Screen preserves accessible navigation

- **WHEN** a project tool tile is rendered as a pressable navigation target
- **THEN** it exposes an accessible button label that describes the destination or action
