## 1. AudioFlow Mobile Foundation

- [x] 1.1 Create an `apps/mobile` AudioFlow token module with colors, spacing, radii, typography, motion, and surface values mapped from `design-system/tokens.json`.
- [x] 1.2 Add reusable React Native style helpers or primitives for screen background, glass panels, pearl buttons, ghost buttons, picker cards, top app bar, chips, and section headings.
- [x] 1.3 Add a reference-view mapping note in the design-system or mobile UI module documentation for the current and future route mappings.
- [x] 1.4 Verify the new foundation can be imported without changing existing app behavior.

## 2. Project Setup Screen

- [x] 2.1 Refactor `apps/mobile/app/(app)/projects/new/index.tsx` to use the AudioFlow screen background, heading treatment, glass panels, option controls, and pearl primary CTA from `New Project.html`.
- [x] 2.2 Preserve existing data loading for voices and interstitial presets, including loading, failure, selected-state, and language-change behavior.
- [x] 2.3 Preserve existing project creation validation, API payload, submission state, and navigation to `projects/new/images`.
- [x] 2.4 Update or add focused mobile tests for project setup behavior after the visual refactor.

## 3. Add Photos Screen

- [x] 3.1 Refactor `apps/mobile/app/(app)/projects/new/images.tsx` to use the AudioFlow top app bar, title block, source actions, mode cards, photo rows, and pearl continue CTA from `Add Photos.html`.
- [x] 3.2 Preserve gallery and camera selection behavior, pending asset state, uploaded image state, count display, and image previews.
- [x] 3.3 Preserve automatic mode behavior: upload, batch OCR with `markReadyForAudio`, generate audio, poll for tracks, and navigate to the player.
- [x] 3.4 Preserve advanced mode behavior: upload, batch OCR, navigate to review, reorder pending photos, remove pending photos, and expose region-edit affordances.
- [x] 3.5 Update or add focused mobile tests for photo selection, mode selection, disabled continue state, and continue behavior.

## 4. Verification

- [x] 4.1 Run `npm run test:mobile` and fix regressions introduced by the UI refactor.
- [x] 4.2 Run mobile lint or the closest available workspace lint command and fix introduced issues.
- [x] 4.3 Manually compare `New Project` and `Add Photos` against `design-system/reference-views/New Project.html` and `design-system/reference-views/Add Photos.html`.
- [x] 4.4 Document any intentional visual differences caused by React Native platform limits, such as blur or shadow behavior.
