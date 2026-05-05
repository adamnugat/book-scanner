## ADDED Requirements

### Requirement: User can select OCR regions on an image preview

The system SHALL let a project owner define OCR text regions by opening a page image preview and drawing rectangular areas directly on the image.

#### Scenario: User opens a page for region selection

- **WHEN** the project owner chooses to define OCR regions for a page image
- **THEN** the system MUST show a larger preview of that page image suitable for touch or pointer interaction

#### Scenario: User draws a region

- **WHEN** the user drags across the page preview and releases inside or near the image bounds
- **THEN** the system MUST create a rectangular OCR region clamped to the visible image area

#### Scenario: User draws outside the image area

- **WHEN** the drag starts or ends outside the rendered image bounds
- **THEN** the system MUST clamp or reject the region so saved coordinates never exceed the page image bounds

#### Scenario: User creates an accidental tiny selection

- **WHEN** the drawn area is below the minimum usable size
- **THEN** the system MUST discard the selection instead of saving an unusable OCR region

### Requirement: Region order is visible and preserved

The system SHALL preserve OCR region reading order according to the order in which regions are defined by the user.

#### Scenario: User defines multiple regions

- **WHEN** the user creates more than one region on a page
- **THEN** each region MUST be displayed with a visible sequence number

#### Scenario: User saves multiple regions

- **WHEN** the user saves multiple regions for one or more page images
- **THEN** the system MUST persist the regions with stable ordering matching the visible sequence numbers

#### Scenario: OCR runs with ordered regions

- **WHEN** OCR processes a page image with saved regions
- **THEN** the OCR input MUST use those regions in the saved order

### Requirement: User can review and remove selected regions

The system SHALL let the user review selected OCR regions before saving and remove incorrect selections.

#### Scenario: User reviews regions on a page

- **WHEN** the page preview contains saved or newly drawn regions
- **THEN** the system MUST render those regions as visible overlays on top of the image preview

#### Scenario: User removes a region

- **WHEN** the user chooses to delete a selected region
- **THEN** the system MUST remove that region and update the visible numbering for remaining regions

#### Scenario: User cancels editing a page

- **WHEN** the user cancels without saving page-region edits
- **THEN** the system MUST leave the previously saved region state unchanged

### Requirement: Empty region selection scans the whole image

The system SHALL treat the absence of saved regions as an instruction to run OCR on the full page image.

#### Scenario: User saves without regions

- **WHEN** the user saves or continues with no selected OCR regions
- **THEN** the system MUST persist an empty region configuration for the project

#### Scenario: OCR runs without regions

- **WHEN** OCR processes a page image that has no saved regions
- **THEN** the system MUST scan the whole page image

#### Scenario: User removes all existing regions

- **WHEN** the user deletes every previously saved region and saves
- **THEN** the system MUST clear those regions so the next OCR run scans whole page images

### Requirement: Region coordinates map to OCR image space

The system SHALL convert preview selections into coordinates that correspond to the underlying page image used by OCR, regardless of preview scale or device screen size.

#### Scenario: Preview is resized to fit the screen

- **WHEN** the page image is displayed smaller or larger than the source image
- **THEN** the saved OCR region MUST represent the same relative area of the page image

#### Scenario: Preview uses a renderable thumbnail

- **WHEN** the UI displays a client-renderable thumbnail for a page image
- **THEN** the saved OCR region MUST still map to the same area of the OCR source image

#### Scenario: Region is saved and reloaded

- **WHEN** the user returns to the region-selection screen after saving regions
- **THEN** the system MUST display the existing regions in the same relative positions on the page preview
