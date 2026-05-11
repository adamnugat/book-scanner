# AudioFlow mobile design system

## Requirements

### Requirement: React Native design tokens

The mobile app SHALL expose AudioFlow design tokens as TypeScript values that can be reused by React Native screens and components.

#### Scenario: Screen imports tokens

- **WHEN** a mobile screen imports the AudioFlow token module
- **THEN** it can access named colors, spacing, radius, typography, motion timing, and surface values that correspond to `design-system/tokens.json`

#### Scenario: Token values preserve visual identity

- **WHEN** a component uses the exported background, glass, pearl, and text tokens
- **THEN** the resulting UI matches the burgundy, glass, and pearl visual language from the design system reference files

### Requirement: Shared mobile UI primitives

The mobile app SHALL provide reusable React Native primitives for the AudioFlow visual language before individual screens duplicate those styles.

#### Scenario: Glass surface

- **WHEN** a screen needs a card, panel, or grouped surface
- **THEN** it can use a shared glass-style primitive or style helper with translucent background, glass-edge border, rounded corners, and inset-like highlight treatment

#### Scenario: Primary action

- **WHEN** a screen needs the main call to action
- **THEN** it can use a shared pearl-style button primitive or style helper with pearl background, ink text, rounded shape, disabled state, and press feedback

#### Scenario: Selection card

- **WHEN** a screen needs a selectable row or mode option
- **THEN** it can use a shared picker-card primitive or style helper with unselected and selected states matching the AudioFlow reference views

### Requirement: Reference view mapping

The design system implementation SHALL document or encode the mapping between reference views and mobile routes so future redesign work can proceed consistently.

#### Scenario: Developer identifies a screen reference

- **WHEN** a developer works on a mobile route covered by `design-system/reference-views`
- **THEN** the corresponding reference HTML file is identifiable from the change documentation or design-system mapping

#### Scenario: Unimplemented reference view

- **WHEN** a reference view exists but is outside the current implementation scope
- **THEN** the app SHALL NOT add incomplete routes or placeholder screens only to match the reference catalog

### Requirement: AudioFlow app shell primitives

The mobile app SHALL provide reusable AudioFlow primitives or style helpers for shared top header and bottom footer menu patterns.

#### Scenario: Screen uses brand header

- **WHEN** a mobile screen needs the AudioFlow brand header
- **THEN** it can render a reusable header with burgundy/glass composition, AudioFlow brand treatment, optional left and right actions, and accessible action labels

#### Scenario: Screen uses footer menu

- **WHEN** a primary mobile screen needs persistent bottom navigation
- **THEN** it can render a reusable footer menu with glass surface, safe-area-aware spacing, active item styling, and a raised pearl primary action

#### Scenario: Footer menu exposes primary creation action

- **WHEN** the footer menu includes the raised pearl action
- **THEN** the action is accessible as the primary way to start creating a new audiobook

### Requirement: AudioFlow form primitives

The mobile app SHALL provide reusable AudioFlow form styling for text inputs and auxiliary links used by authentication screens.

#### Scenario: Screen uses text input styling

- **WHEN** a mobile screen renders an email, password, or similar text field
- **THEN** it can apply AudioFlow field styling with glass-compatible background, readable placeholder text, focus-compatible border treatment, and dark-surface text color

#### Scenario: Screen uses form links

- **WHEN** a mobile screen renders secondary form actions such as reset password or registration
- **THEN** the links use AudioFlow typography and pearl/secondary accent treatment while remaining accessible as links

### Requirement: AudioFlow project list primitives

The mobile app SHALL provide reusable AudioFlow styling for project library cards, status indicators, and toolbar controls.

#### Scenario: Dashboard renders project card

- **WHEN** the dashboard needs to display a project summary
- **THEN** it can use a glass project card treatment with title, language/date metadata, status indicator, and press feedback matching AudioFlow

#### Scenario: Dashboard renders filter controls

- **WHEN** the dashboard needs filter or sort controls
- **THEN** it can render compact AudioFlow chips or segmented controls with distinct selected and unselected states

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
