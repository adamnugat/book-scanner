## 1. Dependencies and Configuration

- [x] 1.1 Add `@google-cloud/vision` as a runtime dependency of `apps/api`.
- [x] 1.2 Update `apps/api/.env.example` with `OCR_PROVIDER=mock`, commented Google OCR setup, and `GOOGLE_APPLICATION_CREDENTIALS` guidance.
- [x] 1.3 Document that the real service account JSON must stay outside git and should be referenced by absolute path or injected as a deployment secret.

## 2. Google OCR Provider

- [x] 2.1 Replace the current Google OCR REST/API-key implementation in `apps/api/src/lib/ocr.ts` with `ImageAnnotatorClient`.
- [x] 2.2 Initialize the Google client from Application Default Credentials when `GOOGLE_APPLICATION_CREDENTIALS` is provided.
- [x] 2.3 Add optional inline credential support for deployment environments if a mounted JSON file is unavailable.
- [x] 2.4 Validate Google OCR configuration when `OCR_PROVIDER=google` and fail clearly if required credentials are missing.
- [x] 2.5 Preserve mock OCR behavior whenever `OCR_PROVIDER` is not set to `google`.
- [x] 2.6 Preserve the existing `OcrResult` contract and region-aware text extraction behavior.

## 3. Error Handling and Safety

- [x] 3.1 Ensure Google API/authentication failures move OCR work into the existing OCR error flow.
- [x] 3.2 Ensure successful Google responses with no detected text return an empty result instead of mock sample text.
- [x] 3.3 Ensure logs and thrown errors do not include private keys, raw JSON credentials, tokens, or full credential file contents.

## 4. Tests and Verification

- [x] 4.1 Add focused API/lib tests for provider selection between mock and Google OCR.
- [x] 4.2 Add tests for missing Google credentials when `OCR_PROVIDER=google`.
- [x] 4.3 Add tests for Google Vision success, no-text response, and provider error handling using a mocked Vision client.
- [x] 4.4 Run `npm run test:api`.
- [x] 4.5 Run `npm run lint`.
- [x] 4.6 Run `npm run build:api`.
