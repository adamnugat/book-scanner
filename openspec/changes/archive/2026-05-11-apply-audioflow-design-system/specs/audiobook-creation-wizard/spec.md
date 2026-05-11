## ADDED Requirements

### Requirement: AudioFlow styling for project setup step
The audiobook creation wizard SHALL render the project setup step using the AudioFlow mobile design system while preserving the existing project creation behavior.

#### Scenario: User opens project setup step
- **WHEN** the user navigates to `projects/new/index`
- **THEN** the screen presents the AudioFlow burgundy ambient background, glass surfaces, glow headline treatment, and pearl-accented primary action based on `design-system/reference-views/New Project.html`

#### Scenario: User configures project basics
- **WHEN** the user enters a title and selects language, voice, and interstitial preset
- **THEN** the screen SHALL preserve the existing validation, API loading states, selected values, and project creation request behavior

#### Scenario: Options fail to load
- **WHEN** voice or interstitial preset loading fails
- **THEN** the screen SHALL preserve the existing error feedback behavior while presenting the error state within the AudioFlow visual language

### Requirement: AudioFlow styling for photo step
The audiobook creation wizard SHALL render the photo step using the AudioFlow mobile design system while preserving the existing image selection and processing behavior.

#### Scenario: User opens photo step
- **WHEN** the user navigates to `projects/new/images`
- **THEN** the screen presents the AudioFlow top app bar, title block, photo source actions, mode cards, and pearl-accented continue action based on `design-system/reference-views/Add Photos.html`

#### Scenario: User adds photos
- **WHEN** the user adds photos from the gallery or camera
- **THEN** the screen SHALL preserve the existing pending image state, uploaded image state, count display, and preview behavior

#### Scenario: User selects automatic mode
- **WHEN** the user continues in automatic mode
- **THEN** the screen SHALL preserve the existing upload, batch OCR, audio generation, audio polling, and player navigation behavior

#### Scenario: User selects advanced mode
- **WHEN** the user continues in advanced mode
- **THEN** the screen SHALL preserve the existing upload, batch OCR, review-step navigation, pending image reorder, pending image removal, and region-edit affordances

### Requirement: Wizard accessibility and testability
The redesigned wizard screens SHALL keep core actions accessible and testable after the visual refactor.

#### Scenario: Primary actions are disabled
- **WHEN** required wizard input is missing or processing is active
- **THEN** the corresponding primary action SHALL expose a disabled state visually and functionally

#### Scenario: Automated tests query actions
- **WHEN** mobile tests render the redesigned wizard screens
- **THEN** core actions for creating the project, adding photos, selecting mode, and continuing the flow remain discoverable by text, role, or accessibility label
