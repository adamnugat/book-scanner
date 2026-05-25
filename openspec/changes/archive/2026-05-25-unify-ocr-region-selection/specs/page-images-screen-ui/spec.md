## ADDED Requirements

### Requirement: Region editing opens the unified editor and returns to page-images on exit

From the project page-images screen, opening region editing for a page SHALL route the user to the shared `OcrRegionEditor` for that single page. The legacy aggregate "Regiony tekstu" listing screen MUST NOT be reachable from the page-images flow. Cancelling or saving in the editor MUST return the user to the page-images screen.

#### Scenario: User taps "Edytuj regiony" on a page card

- **WHEN** the user taps the region-edit affordance on a page card in the page-images screen
- **THEN** the app MUST present the shared `OcrRegionEditor` scoped to that page image, not an aggregate page list

#### Scenario: User cancels region editing

- **WHEN** the user cancels region editing
- **THEN** the app MUST return to the project page-images screen (the screen that opened the editor) and MUST NOT route to a "Regiony tekstu" listing screen

#### Scenario: User saves region edits

- **WHEN** the user saves region edits
- **THEN** the app MUST persist the regions for that page image and return the user to the project page-images screen
- **AND** the page card region counter MUST reflect the updated number of regions for that page

#### Scenario: Legacy aggregate route is gone

- **WHEN** any code or deep link points at the legacy `projects/[id]/text-regions` aggregate screen
- **THEN** the route MUST NOT be registered in the app navigator and MUST NOT render the legacy "Zaznacz regiony tekstu" listing
