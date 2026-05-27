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

### Requirement: Tryb inkrementalny `process-ocr-batch` pozostawia ukończone sceny nietknięte

Endpoint `POST /projects/:projectId/process-ocr-batch` wywołany bez `force=true` (lub z `force=false`) SHALL przetwarzać OCR wyłącznie dla scen, które są nowe (utworzone dla obrazów bez powiązanej sceny) lub mają status `queued`/`ocr_error` lub mają `ocrText IS NULL`. Sceny w statusie `ocr_done`, `ready_for_audio`, `needs_review`, `audio_generating`, `audio_done` lub `audio_error` MUST NOT być reprocesowane w tym trybie i ich `ocrText` MUST pozostać niezmieniony.

#### Scenario: Inkrementalny submit pomija sceny ready_for_audio

- **WHEN** projekt zawiera sceny w statusie `ready_for_audio` z istniejącym `ocrText`
- **AND** klient wywołuje `process-ocr-batch` bez `force=true`
- **THEN** te sceny MUST pozostać w statusie `ready_for_audio`
- **AND** ich `ocrText` MUST pozostać niezmieniony
- **AND** nie MUST być wykonywane wywołanie do Google Cloud Vision dla tych scen

#### Scenario: Inkrementalny submit reprocesuje sceny ocr_error

- **WHEN** projekt zawiera sceny w statusie `ocr_error`
- **AND** klient wywołuje `process-ocr-batch` bez `force=true`
- **THEN** te sceny MUST zostać zreprocesowane przez OCR

#### Scenario: Inkrementalny submit tworzy sceny dla nowych obrazów

- **WHEN** projekt zawiera `PageImage` bez powiązanej `Scene`
- **AND** klient wywołuje `process-ocr-batch` bez `force=true`
- **THEN** backend MUST utworzyć nową `Scene` dla każdego takiego obrazu
- **AND** MUST uruchomić OCR dla nowo utworzonych scen
- **AND** sceny istniejące przed wywołaniem ze statusem `ocr_done` MUST nie być reprocesowane

#### Scenario: Tryb force nadal resetuje wszystkie sceny

- **WHEN** klient wywołuje `process-ocr-batch` z `force=true`
- **THEN** wszystkie istniejące sceny projektu MUST zostać zresetowane do statusu `queued` z `ocrText=null` i `editedText=null`
- **AND** OCR MUST zostać uruchomiony dla wszystkich scen

### Requirement: Usunięcie zdjęcia strony sprząta powiązane pliki audio ze storage

Endpoint `DELETE /projects/:projectId/images/:imageId` SHALL usuwać z S3/MinIO wszystkie pliki audio (`AudioTrack.storagePath`) powiązane z kaskadowo usuwanymi scenami przed usunięciem rekordu `PageImage` z bazy danych. Błąd usuwania pliku audio MUST być logowany (`console.warn`) i połykany — usunięcie rekordów DB ma priorytet, aby nie zostawiać sierot w bazie.

#### Scenario: Usuwanie obrazu z powiązanym audio

- **WHEN** klient wywołuje `DELETE /projects/:projectId/images/:imageId` dla obrazu, którego powiązana `Scene` ma `AudioTrack`
- **THEN** backend MUST wywołać `deleteFile(track.storagePath)` dla pliku audio przed usunięciem `PageImage`
- **AND** MUST następnie usunąć `PageImage` (cascade DB usunie `Scene`, `TextRegion`, `AudioTrack`)
- **AND** MUST zwrócić `200 { message: 'Image deleted' }`

#### Scenario: Usuwanie obrazu bez powiązanego audio

- **WHEN** klient wywołuje `DELETE /projects/:projectId/images/:imageId` dla obrazu bez `AudioTrack` (lub w ogóle bez `Scene`)
- **THEN** backend MUST usunąć pliki obrazu i thumbnaila ze storage (jak dotychczas)
- **AND** MUST usunąć `PageImage` z bazy
- **AND** żadne wywołanie `deleteFile` dla audio nie MUST się odbyć

#### Scenario: Błąd S3 przy sprzątaniu audio nie blokuje usunięcia z DB

- **WHEN** `deleteFile(track.storagePath)` rzuca wyjątek (S3 niedostępne lub plik nie istnieje)
- **THEN** backend MUST zalogować ostrzeżenie
- **AND** MUST kontynuować i usunąć `PageImage` z bazy
- **AND** MUST zwrócić `200 { message: 'Image deleted' }`
