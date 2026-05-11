## ADDED Requirements

### Requirement: AudioFlow top header
The mobile app SHALL use an AudioFlow-compatible top header on redesigned primary screens without changing route semantics.

#### Scenario: Dashboard shows brand header
- **WHEN** the authenticated dashboard is displayed
- **THEN** the screen shows a top header with AudioFlow brand treatment and accessible actions for available dashboard controls

#### Scenario: Auth screen hides native header
- **WHEN** the login screen is displayed
- **THEN** the native stack header remains hidden and the screen-owned AudioFlow layout provides the visible brand treatment

#### Scenario: Existing back navigation semantics remain unchanged
- **WHEN** the user navigates between existing app or auth routes
- **THEN** the route history, back behavior, and stack semantics remain consistent with the pre-redesign app

### Requirement: AudioFlow footer menu
The mobile app SHALL provide an AudioFlow bottom footer menu for redesigned primary app screens.

#### Scenario: Dashboard footer shows library state
- **WHEN** the authenticated dashboard is displayed
- **THEN** the footer menu shows the library/dashboard destination as active

#### Scenario: Dashboard footer starts new audiobook
- **WHEN** the user presses the raised pearl footer action
- **THEN** the system navigates to the existing new audiobook route `/(app)/projects/new`

#### Scenario: Footer avoids invalid project routes
- **WHEN** a footer menu destination would require a concrete project id that is not available
- **THEN** the footer menu does not navigate to a placeholder or invalid project route

#### Scenario: Footer respects safe area and content
- **WHEN** the footer menu is rendered on a mobile device
- **THEN** the screen content leaves enough bottom padding so the footer does not cover tappable dashboard content
