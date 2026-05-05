## 1. Diagnose Image Delivery

- [x] 1.1 Reproduce the current page image display issue on the project images screen using existing upload/camera/gallery flows.
- [x] 1.2 Verify `GET /projects/:id/images` and upload responses return usable `imageUrl` and `thumbnailUrl` values for Expo Web and native clients.
- [x] 1.3 Confirm protected image and thumbnail endpoints return expected content type, status codes, and image bytes for valid asset tokens.
- [x] 1.4 Document whether the final implementation needs backend changes or can remain mobile-only.

Diagnosis: existing backend image responses generate protected file/thumbnail URLs from the request host and preserve tokenized access. The reproduced missing behaviors are in `apps/mobile`: immediate upload after picker/camera selection and direct `Image` rendering without visible load/error states, so this implementation can remain mobile-only unless later verification reveals a backend regression.

## 2. Mobile Image Rendering

- [x] 2.1 Add a reusable page image preview component or helper in `apps/mobile` that accepts thumbnail/original URLs and renders the correct source.
- [x] 2.2 Add loading and visible error states for page image rendering.
- [x] 2.3 Replace direct `Image` usage for page images on the project images screen, text-region screen, and scene editor with the shared rendering behavior.
- [x] 2.4 Ensure fallback from `thumbnailUrl` to `imageUrl` works consistently when thumbnails are missing.

## 3. Local Capture Preview

- [x] 3.1 Change gallery selection and camera capture flows to store selected `ImagePickerAsset` items as pending local photos instead of uploading immediately.
- [x] 3.2 Add a local preview UI for pending photos with image thumbnails, filenames or page labels, and count.
- [x] 3.3 Add actions to remove a single pending photo, cancel all pending photos, and confirm upload.
- [x] 3.4 Upload only confirmed pending photos and preserve existing per-file progress and partial-failure feedback.
- [x] 3.5 After upload, show server-returned page images immediately in the page list and keep the existing next-step navigation behavior.

## 4. Backend Fixes If Needed

- [x] 4.1 If diagnosis shows broken asset URLs, adjust URL generation or asset endpoint behavior without changing the `PageImageResponse` contract unless unavoidable.
- [x] 4.2 If backend asset behavior changes, add or update API tests for image URL responses and protected file/thumbnail delivery.
- [x] 4.3 Preserve existing upload validation, magic-byte validation, thumbnail generation, private project access, and token-protected asset access.

Backend note: no backend code changes were needed, so asset URL generation, upload validation, thumbnail generation, and token-protected delivery remain unchanged.

## 5. Tests and Verification

- [x] 5.1 Add focused mobile tests for pending photo preview, removing/canceling pending photos, confirming upload, and image error/loading states where testable.
- [x] 5.2 Run `npm run test:mobile`.
- [x] 5.3 Run `npm run test:api` if backend image delivery code changes.
- [x] 5.4 Run `npm run lint`.
- [x] 5.5 Run `npm run format:check`.

Format note: `npm run format:check` was run and failed on 66 repo-wide pre-existing files. Files changed for this implementation were formatted with Prettier and passed a targeted `prettier --check`.
