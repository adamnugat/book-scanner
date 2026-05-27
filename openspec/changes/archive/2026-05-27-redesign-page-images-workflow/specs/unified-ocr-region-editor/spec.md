## MODIFIED Requirements

### Requirement: Single shared OCR region editor component

The mobile app SHALL provide one shared component (`OcrRegionEditor`) used to define OCR regions for a single page image. The component MUST be the only implementation rendered by both the audiobook creation wizard (advanced mode) and the project page-images screen. On the page-images screen the editor MUST be presented inside a **modal host** (not a separate navigation route), ensuring identical visual and behavioral output across entry points.

#### Scenario: Wizard advanced mode opens the editor

- **WHEN** the user opens region editing for a page in the audiobook creation wizard's advanced mode
- **THEN** the shared `OcrRegionEditor` component MUST render the editor UI, not any wizard-local duplicate

#### Scenario: Page-images screen opens the editor in a modal

- **WHEN** the user opens region editing for a page from the project page-images screen
- **THEN** the shared `OcrRegionEditor` component MUST render inside a modal host, not a separate route and not any project-local duplicate

#### Scenario: Visual parity across entry points

- **WHEN** the same page image is opened in the editor from either entry point
- **THEN** the editor MUST display the same layout, typography, colors, spacing, and action affordances
