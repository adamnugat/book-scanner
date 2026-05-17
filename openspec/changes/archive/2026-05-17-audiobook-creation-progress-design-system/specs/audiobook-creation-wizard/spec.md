## MODIFIED Requirements

### Requirement: Wizard accessibility and testability

The redesigned wizard screens SHALL keep core actions accessible and testable after the visual refactor.

#### Scenario: Primary actions are disabled

- **WHEN** required wizard input is missing or processing is active
- **THEN** the corresponding primary action SHALL expose a disabled state visually and functionally

#### Scenario: Automated tests query actions

- **WHEN** mobile tests render the redesigned wizard screens
- **THEN** core actions for creating the project, adding photos, selecting mode, and continuing the flow remain discoverable by text, role, or accessibility label

#### Scenario: Processing overlay is accessible

- **WHEN** the automatic mode processing overlay is visible
- **THEN** each step in the 3-step timeline SHALL have an accessible label indicating its state (completed, active, or pending)
- **AND** the overlay SHALL not block gesture-based navigation that could trigger unintended side effects
