## ADDED Requirements

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
