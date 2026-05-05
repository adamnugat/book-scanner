## Context

`apps/mobile/app/(app)/projects/[id]/text-regions.tsx` currently lists page images and lets the user add regions by typing numeric `x`, `y`, `width`, and `height` values. The existing API stores those values in `TextRegion` rows and `process-ocr` passes them to `recognizeText`, but the Prisma model has no explicit order field and the route does not accept an empty region list to clear previous selections.

The new UX should keep the same project flow: upload/reorder images, optionally define OCR regions, then generate scenes. It should reuse protected `PageImageResponse` image URLs and `PageImagePreview` behavior, and it should not change OCR provider configuration, storage, authentication, sharing, billing, or TTS behavior.

## Goals / Non-Goals

**Goals:**

- Replace manual coordinate entry with a touch-friendly image preview where users draw rectangular OCR regions.
- Preserve the user-defined reading order by showing numbered overlays and passing regions to OCR in that order.
- Keep region selection optional: no saved regions means OCR processes the whole page image.
- Make coordinate mapping independent of the preview size so drawn regions still match OCR coordinates.
- Keep the existing `POST /projects/:projectId/scenes/text-regions` route as the save path.

**Non-Goals:**

- No change to Google Cloud Vision setup, OCR provider selection, or OCR credentials.
- No image upload, thumbnail generation, storage provider, auth, sharing, billing, TTS, deep link, or offline audio cache changes.
- No free-form polygon/lasso selection; regions remain rectangles.
- No automatic OCR run while drawing regions.

## Decisions

### Store OCR regions with stable order

Add an explicit `orderIndex` to `TextRegion` and the shared text-region contract. The mobile UI will send regions in user-visible order; the API will also assign `orderIndex` from the submitted array position so older clients that omit it can still be ordered deterministically.

Alternative considered: rely on database creation order. This is fragile because Prisma relation includes do not guarantee stable ordering, and there is no `createdAt` column on `TextRegion`.

### Use normalized image coordinates for the drawing contract

The drawing UI should convert each rectangle to normalized coordinates relative to the displayed page image bounds: `x`, `y`, `width`, and `height` as values from `0` to `1`. The OCR extraction path can convert normalized regions into the coordinate space returned by Google Vision, using the OCR page dimensions when available. This avoids coupling region persistence to the size of a thumbnail, the original uploaded image, or the user's screen.

Alternative considered: store absolute original-image pixels from the mobile client. That would require reliable original dimensions on the client and is brittle for HEIC originals where the client may render a generated thumbnail instead of the source file.

### Keep the editor inside the existing region-selection step

Refactor `text-regions.tsx` into a selection screen with page cards and a focused editor state. Pressing a page opens an enlarged preview on the same screen or in a modal-like overlay. Users draw a rectangle by dragging from start to end; the completed rectangle is clamped to the image bounds, added to the end of that page's region list, and displayed with its sequence number. The editor should support deleting a selected region and cancelling unsaved edits.

Alternative considered: create a separate route per image. That adds navigation complexity without changing the core behavior and makes it harder to review all page-region counts before saving.

### Save project-level region state, including empty state

The API should treat the submitted `regions` array as the current region configuration for the project. An empty array is valid and clears existing regions so that future OCR runs scan whole images. For non-empty submissions, the route should verify that each `pageImageId` belongs to the authenticated project before deleting and recreating that project's regions.

Alternative considered: keep the current behavior that rejects empty arrays and only replaces regions for included page IDs. That leaves stale regions behind when a user removes all selections, which contradicts the optional-region requirement.

### Add a read path for saved regions

Add a project-owner-only read path for text regions, either as `GET /projects/:projectId/scenes/text-regions` or by extending the existing images response with ordered region data. Prefer a dedicated `GET` route because it keeps `PageImageResponse` focused on image metadata and lets the region editor load only the data it needs.

Alternative considered: keep saved regions client-only until OCR runs. That fails the reload scenario and makes it impossible to review or clear existing selections after navigating away.

## Risks / Trade-offs

- Existing manually entered pixel-based regions may not match normalized-coordinate semantics -> during implementation, either clear/redefine existing regions in dev data or add a temporary legacy fallback for values greater than `1`.
- Gesture math can be error-prone across native and web targets -> keep coordinate conversion in a small helper with unit tests, and clamp rectangles before saving.
- Very small accidental drags could create unusable regions -> ignore rectangles below a minimum displayed size and keep a visible delete action.
- Backend changes touch persisted data -> add a Prisma migration for `orderIndex` and cover save/order behavior with API tests.
- OCR region extraction currently falls back to full text when region extraction returns empty text -> preserve this fallback unless tests prove it hides user mistakes.

## Migration Plan

1. Add `orderIndex` to `TextRegion` with a default/backfill for existing rows.
2. Update shared `TextRegionInput` to include optional or required `orderIndex` depending on route compatibility needs.
3. Update the save route to accept empty arrays, validate project ownership for all referenced images, clear project regions, and recreate rows in submitted order.
4. Add a region read route or equivalent response contract for loading saved regions into the editor.
5. Update OCR processing to fetch text regions ordered by `orderIndex` and convert normalized regions before text extraction.
6. Replace the mobile numeric form with the touch editor and focused tests.
7. Rollback is limited to reverting code and migration changes; existing region data may need to be cleared if normalized values were saved.

## Open Questions

- Should the first implementation allow reordering existing regions after drawing, or is delete-and-redraw sufficient for MVP? The proposal requires order visibility; explicit drag-to-reorder can be deferred if numbered drawing order is clear.
