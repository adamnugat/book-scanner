### Requirement: Google Cloud Vision provider is available for OCR

The system SHALL provide a Google Cloud Vision OCR provider that can be selected through backend configuration without changing the OCR API contract used by the mobile app.

#### Scenario: Google provider is selected

- **WHEN** the backend runs with `OCR_PROVIDER=google`
- **THEN** OCR processing MUST use Google Cloud Vision for uploaded page images instead of returning mock sample text

#### Scenario: Mock provider remains default

- **WHEN** `OCR_PROVIDER` is not set to `google`
- **THEN** OCR processing MUST keep using the existing mock provider for local and test environments

#### Scenario: OCR response contract is preserved

- **WHEN** Google Cloud Vision returns recognized text for a page image
- **THEN** the backend MUST expose the recognized text through the existing OCR result flow without requiring mobile API changes

### Requirement: Service account credentials configure Google OCR

The system SHALL support Google Cloud Vision authentication using a service account JSON key supplied outside the repository.

#### Scenario: Credentials file path is configured

- **WHEN** `OCR_PROVIDER=google` and `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account JSON file
- **THEN** the Google OCR provider MUST authenticate with that file

#### Scenario: Credentials are not committed

- **WHEN** documenting Google OCR setup
- **THEN** documentation and examples MUST instruct the operator to keep the real JSON key out of the repository and provide only a path or secret-managed value

#### Scenario: Required service account fields are present

- **WHEN** Google OCR credentials are validated from service account JSON
- **THEN** the configuration MUST include the required `project_id`, `client_email`, and `private_key` values needed to authenticate

#### Scenario: Credentials are missing

- **WHEN** `OCR_PROVIDER=google` but no supported Google credentials configuration is available
- **THEN** OCR processing MUST fail with a clear configuration error instead of silently falling back to mock text

### Requirement: Google OCR failures are explicit

The system SHALL report Google Cloud Vision configuration and provider failures through explicit OCR error handling while preserving the existing asynchronous processing flow.

#### Scenario: Google Vision rejects a request

- **WHEN** Google Cloud Vision returns an API or authentication error during OCR
- **THEN** the backend MUST mark the affected OCR work as failed using the existing error status flow

#### Scenario: Google provider returns no text

- **WHEN** Google Cloud Vision succeeds but detects no readable text
- **THEN** OCR processing MUST complete with an empty recognized text result rather than mock sample text

#### Scenario: Secrets are not logged

- **WHEN** Google OCR configuration or API errors are logged
- **THEN** logs MUST NOT include the private key, raw service account JSON, access tokens, or full credential file contents

### Requirement: Google OCR setup is documented

The system SHALL document how to enable Google Cloud Vision OCR for local development and deployment.

#### Scenario: Local setup uses a JSON file path

- **WHEN** a developer follows the documented local setup
- **THEN** they MUST be told to save the service account JSON outside tracked source files and set `OCR_PROVIDER=google` plus `GOOGLE_APPLICATION_CREDENTIALS` in `apps/api/.env`

#### Scenario: Dependency is visible

- **WHEN** a developer inspects `apps/api/package.json`
- **THEN** the Google Cloud Vision runtime dependency MUST be listed there
