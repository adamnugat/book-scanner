## ADDED Requirements

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
