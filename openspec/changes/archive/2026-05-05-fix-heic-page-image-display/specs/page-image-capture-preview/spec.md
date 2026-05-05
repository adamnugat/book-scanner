## ADDED Requirements

### Requirement: HEIC gallery uploads produce renderable page previews

The system SHALL ensure that a supported HEIC or HEIF photo selected from the user's gallery and uploaded to a project produces a page image preview source that the mobile client can render after upload.

#### Scenario: HEIC photo uploads successfully

- **WHEN** a user selects a HEIC or HEIF page photo from the gallery and confirms upload
- **THEN** the uploaded page image MUST appear in the project page list with a renderable preview source

#### Scenario: Server accepts HEIC original

- **WHEN** the API accepts a HEIC or HEIF original image for a page upload
- **THEN** the API MUST return a `thumbnailUrl` or equivalent existing preview URL that points to an image format supported by the client

#### Scenario: Thumbnail generation fails for HEIC

- **WHEN** a HEIC or HEIF page image cannot be converted into a client-renderable preview
- **THEN** the upload MUST fail with a clear validation or processing error instead of creating a page image that only renders as an image error state

#### Scenario: Existing private asset access is preserved

- **WHEN** the system returns a renderable preview for an uploaded HEIC or HEIF page image
- **THEN** the preview URL MUST preserve the existing private, token-protected asset access behavior

### Requirement: iPhone gallery image metadata is normalized for upload

The system SHALL normalize image metadata from iPhone gallery selections sufficiently for the existing upload validation and storage pipeline to identify supported HEIC and HEIF files.

#### Scenario: Picker returns HEIC MIME type

- **WHEN** the image picker returns `image/heic` or `image/heif` for a selected gallery photo
- **THEN** the upload request MUST preserve or map that type to a backend-supported image type

#### Scenario: Picker omits MIME type for HEIC file

- **WHEN** the image picker returns no MIME type for a selected gallery photo whose filename or URI indicates HEIC or HEIF
- **THEN** the upload request MUST provide a supported image type or convert the asset before upload

#### Scenario: Picker reports an unsupported HEIC variant

- **WHEN** the selected gallery photo is a HEIC or HEIF variant that the system cannot validate or convert
- **THEN** the user MUST receive a clear message explaining that the image cannot be uploaded in its current format
