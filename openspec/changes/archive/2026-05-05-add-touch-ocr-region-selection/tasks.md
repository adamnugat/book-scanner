## 1. Shared Contracts And Data Model

- [x] 1.1 Add `orderIndex` to the Prisma `TextRegion` model and create the migration with a safe default/backfill.
- [x] 1.2 Update shared text-region types to support ordered saved regions and the region read response.
- [x] 1.3 Add or update backend test fixtures/factories for ordered text regions.

## 2. API Region Persistence

- [x] 2.1 Update `POST /projects/:projectId/scenes/text-regions` to accept an empty region array and clear the project's saved regions.
- [x] 2.2 Validate that every submitted `pageImageId` belongs to the authenticated project owner before persisting regions.
- [x] 2.3 Persist submitted regions with stable `orderIndex` values matching the request order.
- [x] 2.4 Add a project-owner-only read path for saved text regions ordered by page and region order.
- [x] 2.5 Add API tests for empty clears, project ownership validation, ordered persistence, and ordered reads.

## 3. OCR Region Processing

- [x] 3.1 Fetch page image text regions ordered by `orderIndex` before passing them to OCR.
- [x] 3.2 Convert normalized region coordinates to OCR annotation coordinates during extraction.
- [x] 3.3 Add OCR unit tests covering ordered region extraction, normalized coordinate mapping, and whole-image fallback when no regions exist.

## 4. Mobile Region Editor

- [x] 4.1 Replace numeric coordinate inputs in `text-regions.tsx` with a page list that opens a focused image-region editor.
- [x] 4.2 Implement preview layout measurement and helper functions for clamped normalized rectangle creation.
- [x] 4.3 Implement touch or pointer drawing for rectangular regions without adding a new gesture dependency unless React Native primitives are insufficient.
- [x] 4.4 Render numbered region overlays and keep numbering in saved OCR order.
- [x] 4.5 Support deleting regions, cancelling page edits, saving all project regions, and continuing with zero regions.
- [x] 4.6 Load saved regions when the screen opens and redraw them in the correct relative positions.
- [x] 4.7 Add focused mobile tests for drawing helpers, delete/renumber behavior, empty save behavior, and loading saved regions.

## 5. Verification

- [x] 5.1 Run `npm run test:api` and fix regressions.
- [x] 5.2 Run `npm run test:mobile` and fix regressions.
- [x] 5.3 Run `npm run lint` and fix lint issues in touched workspaces.
- [x] 5.4 Run `npm run build:api` if backend TypeScript or Prisma types changed.
- [ ] 5.5 Manually verify the mobile flow: upload/select page images, draw multiple numbered regions, delete one, save, reopen, and run OCR with and without regions.
