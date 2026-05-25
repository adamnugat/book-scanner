## ADDED Requirements

### Requirement: Wizard advanced mode uses the unified OCR region editor

In the audiobook creation wizard's advanced mode, opening region editing for a page (either an uploaded image or a locally pending asset) SHALL render the shared `OcrRegionEditor` component. The wizard MUST NOT keep its own duplicate region-editor modal or styling.

#### Scenario: Advanced mode opens region editor

- **WHEN** the user is in advanced mode and opens region editing for a page card
- **THEN** the wizard MUST mount the shared `OcrRegionEditor` component (the same one used by the project page-images screen)

#### Scenario: Cancel returns to wizard step 2

- **WHEN** the user cancels region editing inside the wizard
- **THEN** the wizard MUST return the user to step 2 (add-photos step) with previously chosen mode, photos, and region drafts intact

#### Scenario: Save persists draft regions in wizard memory

- **WHEN** the user saves region edits inside the wizard
- **THEN** the wizard MUST merge the returned regions into its in-memory `regions` draft, keyed by the page image id (uploaded) or pending URI (not yet uploaded), and return to step 2
- **AND** the page card MUST reflect the updated region count
