## 1. Diagnose HEIC Upload Path

- [x] 1.1 Reproduce the failing flow with an iPhone HEIC gallery image: local preview works, confirmed upload succeeds or fails, page list renders result.
- [x] 1.2 Inspect `expo-image-picker` asset metadata for HEIC selections, including `uri`, `fileName`, `mimeType`, extension, and platform differences.
- [x] 1.3 Verify the multipart payload built by `apps/mobile/lib/api.ts` preserves or maps HEIC/HEIF metadata correctly.
- [x] 1.4 Verify API upload handling for HEIC/HEIF: shared supported types, multer MIME, magic-byte validation, original storage `contentType`, and `PageImageResponse`.
- [x] 1.5 Verify thumbnail generation for the same HEIC bytes and document whether Sharp/libvips supports the format in the local/test environment.

Diagnosis: automated tests reproduced the two root causes: iPhone-style `.HEIC` picker assets without `mimeType` were sent as `image/jpeg`, and backend HEIC uploads could create a page without a renderable thumbnail when Sharp conversion failed. Local Sharp reports HEIF input support, but HEIC support still depends on libheif/HEVC decoder availability, so accepted HEIC/HEIF uploads now require a generated WebP thumbnail.

## 2. Backend Image Compatibility

- [x] 2.1 If Sharp can convert HEIC/HEIF, ensure accepted HEIC uploads always generate a client-renderable thumbnail under the existing `thumbnailUrl`.
- [x] 2.2 If Sharp cannot convert HEIC/HEIF, change the backend behavior so unsupported HEIC variants fail with a clear validation or processing error instead of creating an unpreviewable page image.
- [x] 2.3 Add support for `image/heif` if the picker or real devices report HEIF separately from `image/heic`.
- [x] 2.4 Preserve protected asset token validation and the existing `PageImageResponse` shape for file and thumbnail URLs.

## 3. Mobile Upload Normalization

- [x] 3.1 Add a small helper for deriving upload filename and MIME type from picker assets, including HEIC/HEIF filename and URI fallbacks.
- [x] 3.2 Use the helper in gallery, camera, and web drop upload paths without changing pending preview behavior.
- [x] 3.3 If backend-compatible HEIC upload cannot be guaranteed, convert or reject the asset before upload with a clear user-facing message.
- [x] 3.4 Keep partial-failure behavior so failed HEIC assets remain pending while successfully uploaded images appear in the page list.

Implementation note: real-device testing hit the backend `422` path for a gallery photo, confirming that the app must convert HEIC/HEIF before upload in environments where Sharp cannot decode the original. The mobile upload helper now exports HEIC/HEIF assets to JPEG with `expo-image-manipulator` and uploads the converted file while keeping the original local preview.

## 4. Tests

- [x] 4.1 Add API tests for accepted HEIC/HEIF metadata and thumbnail behavior, or for the explicit rejection path if conversion is unavailable.
- [x] 4.2 Add mobile tests for upload metadata normalization from HEIC/HEIF picker assets.
- [x] 4.3 Add or update mobile tests proving successful uploads are added to the list with a renderable preview URL and failed uploads keep a clear error path.

## 5. Verification

- [x] 5.1 Run `npm run test:api` if backend image handling changes.
- [x] 5.2 Run `npm run test:mobile`.
- [x] 5.3 Run `npm run lint`.
- [x] 5.4 Run `npm run format:check` or document pre-existing formatting blockers and run targeted formatting checks for changed files.
- [x] 5.5 Manually verify the reported iPhone HEIC gallery flow on a real device or simulator when available.

Verification note: `npm run test:mobile` passes, and targeted `apps/api` image tests pass. Real-device testing then exposed `401` on tokenized thumbnail URLs; API tests now cover file/thumbnail access with only an asset token and no `Authorization` header. `npm run lint` exits successfully with one unrelated warning in `apps/mobile/app/(app)/projects/[id]/voice.tsx`. Full `npm run format:check` was run earlier and still reports repo-wide pre-existing formatting issues, but the changed-file subset passes Prettier.
