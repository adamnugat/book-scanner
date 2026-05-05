## ADDED Requirements

### Requirement: Page images render with visible load and error states
The system SHALL render page images from `PageImageResponse` using the thumbnail URL when available and the original image URL as fallback, while exposing visible loading and error states instead of leaving an empty image area.

#### Scenario: Thumbnail URL is available
- **WHEN** a project image has both `thumbnailUrl` and `imageUrl`
- **THEN** the UI MUST render the thumbnail URL as the primary source for the page preview

#### Scenario: Thumbnail URL is missing
- **WHEN** a project image has no `thumbnailUrl` but has an `imageUrl`
- **THEN** the UI MUST render the original image URL as the page preview fallback

#### Scenario: Image fails to load
- **WHEN** the selected image source cannot be loaded by the client
- **THEN** the UI MUST show a visible error state for that page image

#### Scenario: Image is loading
- **WHEN** the client is waiting for a page image to load
- **THEN** the UI MUST show a visible loading or placeholder state in the image area

### Requirement: Captured and selected photos can be previewed before upload
The system SHALL allow users to preview photos selected from the gallery or captured with the camera before those photos are uploaded to the project.

#### Scenario: User captures a photo
- **WHEN** the user captures a page photo with the camera and does not cancel the camera flow
- **THEN** the UI MUST show the captured photo in a local preview before uploading it

#### Scenario: User selects photos from gallery
- **WHEN** the user selects one or more page photos from the gallery
- **THEN** the UI MUST show the selected photos in a local preview before uploading them

#### Scenario: User removes a pending photo
- **WHEN** the user removes a photo from the local preview before upload
- **THEN** the system MUST exclude that photo from the upload request

#### Scenario: User cancels pending photos
- **WHEN** the user cancels the local preview
- **THEN** the system MUST discard all pending photos without uploading them

#### Scenario: User confirms pending photos
- **WHEN** the user confirms the local preview
- **THEN** the system MUST upload only the remaining pending photos to the current project

### Requirement: Newly uploaded photos appear immediately in page order
The system SHALL show successfully uploaded page photos on the project images screen immediately after upload with server-provided metadata and ordering.

#### Scenario: Upload succeeds
- **WHEN** one or more pending photos are uploaded successfully
- **THEN** the UI MUST add the returned page images to the visible page list using the server response

#### Scenario: Partial upload failure
- **WHEN** only some pending photos upload successfully
- **THEN** the UI MUST show the successful page images in the page list and report the failed uploads to the user

#### Scenario: User proceeds after upload
- **WHEN** the project has at least one visible page image after upload
- **THEN** the UI MUST allow the user to continue to the next page-processing step

### Requirement: Private image access remains protected
The system SHALL preserve authenticated project access and token-protected image asset delivery for page images.

#### Scenario: Page image URLs are returned by API
- **WHEN** the API returns page image responses for an authenticated project owner
- **THEN** the image URLs MUST point to protected asset endpoints or an equivalent private access mechanism

#### Scenario: Unauthorized asset request
- **WHEN** an image asset request is missing an asset token or uses an invalid token
- **THEN** the API MUST reject the request without returning the image bytes
