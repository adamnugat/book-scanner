## ADDED Requirements

### Requirement: Region selection UI is consistent across entry points

The region-selection UI SHALL be visually and behaviorally identical regardless of whether the user enters it from the audiobook creation wizard or the project page-images screen. Both entry points MUST use the shared `OcrRegionEditor` component and the AudioFlow design system.

#### Scenario: Same UI from wizard

- **WHEN** the user opens region editing from the audiobook creation wizard (advanced mode)
- **THEN** the editor MUST present the same layout, controls, typography, and colors as the project entry point

#### Scenario: Same UI from page-images

- **WHEN** the user opens region editing from the project page-images screen
- **THEN** the editor MUST present the same layout, controls, typography, and colors as the wizard entry point

#### Scenario: Same gestures and feedback

- **WHEN** the user draws, lists, or removes regions in either entry point
- **THEN** the gesture handling, live drag rectangle feedback, and region numbering MUST behave identically

## MODIFIED Requirements

### Requirement: User can review and remove selected regions

The system SHALL let the user review selected OCR regions before saving and remove incorrect selections. Cancellation MUST return the user to the screen from which they entered region editing.

#### Scenario: User reviews regions on a page

- **WHEN** the page preview contains saved or newly drawn regions
- **THEN** the system MUST render those regions as visible overlays on top of the image preview

#### Scenario: User removes a region

- **WHEN** the user chooses to delete a selected region
- **THEN** the system MUST remove that region and update the visible numbering for remaining regions

#### Scenario: User cancels editing a page

- **WHEN** the user cancels without saving page-region edits
- **THEN** the system MUST leave the previously saved region state unchanged
- **AND** the system MUST return the user to the screen that opened the editor (the audiobook creation wizard or the project page-images screen), and MUST NOT route to any standalone "Regiony tekstu" / "Text Regions" listing screen
