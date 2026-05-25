## ADDED Requirements

### Requirement: Single shared OCR region editor component

The mobile app SHALL provide one shared component (`OcrRegionEditor`) used to define OCR regions for a single page image. The component MUST be the only implementation rendered by both the audiobook creation wizard (advanced mode) and the project page-images screen, ensuring identical visual and behavioral output.

#### Scenario: Wizard advanced mode opens the editor

- **WHEN** the user opens region editing for a page in the audiobook creation wizard's advanced mode
- **THEN** the shared `OcrRegionEditor` component MUST render the editor UI, not any wizard-local duplicate

#### Scenario: Page-images screen opens the editor

- **WHEN** the user opens region editing for a page from the project page-images screen
- **THEN** the shared `OcrRegionEditor` component MUST render the editor UI, not any project-local duplicate

#### Scenario: Visual parity across entry points

- **WHEN** the same page image is opened in the editor from either entry point
- **THEN** the editor MUST display the same layout, typography, colors, spacing, and action affordances

### Requirement: Editor follows the AudioFlow design system

The `OcrRegionEditor` component SHALL use only design tokens from `audioFlowTokens` (colors, typography, radii, spacing) and AudioFlow primitives (`AudioFlowScreen`, `FadeZoomContent`, `GlassPanel`, `AudioFlowFooterMenu`). The component MUST NOT use raw hex color literals or ad-hoc styles outside the design system.

#### Scenario: Background and surfaces

- **WHEN** the editor renders
- **THEN** the page background MUST be the `AudioFlowScreen` ambient background and the image preview/region list MUST sit on `GlassPanel` surfaces from the design system

#### Scenario: Typography

- **WHEN** the editor renders titles, eyebrows, and body text
- **THEN** typography MUST come from `audioFlowStyles` / `audioFlowTokens.typography.*`

#### Scenario: Region overlay colors

- **WHEN** the editor renders region overlays or the live drag rectangle
- **THEN** the colors MUST be sourced from `audioFlowTokens.color.accent.*`, with the same semantic accent reused across both entry points

#### Scenario: Icons follow Feather set

- **WHEN** the editor renders icon affordances (e.g. delete region, close, confirm)
- **THEN** icons MUST come from Feather via `@expo/vector-icons`

### Requirement: Editor supports both uploaded and pending page targets

The `OcrRegionEditor` component SHALL accept either an uploaded `PageImage` (with `id` and remote URL) or a locally pending asset (with local `uri`) as its target, so the same component works inside the wizard before upload and inside the project after upload.

#### Scenario: Uploaded image target

- **WHEN** the editor is opened with an uploaded `PageImage` target
- **THEN** the preview MUST render that image and the saved regions MUST be associated to the page image id

#### Scenario: Pending asset target

- **WHEN** the editor is opened with a pending asset target (local URI not yet uploaded)
- **THEN** the preview MUST render the local asset and the editor MUST return regions keyed by the pending URI so the caller can persist them after upload

### Requirement: Editor returns control to the caller on cancel and save

The `OcrRegionEditor` component SHALL expose `onCancel` and `onSave` callbacks and MUST NOT navigate directly. The hosting screen is responsible for returning the user to whichever screen originated the editor.

#### Scenario: User cancels editing

- **WHEN** the user taps the cancel action in the editor
- **THEN** the editor MUST invoke `onCancel` without saving and MUST NOT change app routes by itself

#### Scenario: User saves edited regions

- **WHEN** the user taps the save action
- **THEN** the editor MUST invoke `onSave` with the current list of regions for the target and MUST NOT change app routes by itself

#### Scenario: Empty save means scan whole page

- **WHEN** the user saves with no regions defined
- **THEN** `onSave` MUST be invoked with an empty list so the caller can persist the empty configuration (which is treated as "OCR whole page" elsewhere in the system)
