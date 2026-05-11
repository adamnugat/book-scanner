## 1. AudioFlow Primitives

- [x] 1.1 Compare `Project Details.html`, current `projects/[id]/index.tsx`, and existing `audioflow.tsx` primitives to identify the smallest reusable additions.
- [x] 1.2 Add reusable AudioFlow presentation helpers for the Project Details hero-player, including cover/placeholder styling, readable overlay, status/meta row, glass player panel, pearl play control, and progress bar treatment.
- [x] 1.3 Add a reusable AudioFlow project tool tile primitive or style helper with accessible label support, icon/meta/title/body slots, glass surface, and press feedback.
- [x] 1.4 Extend or verify `AudioFlowFooterMenu` supports the Project Details active/player state and existing routes without requiring new navigation targets.

## 2. Project Details Screen

- [x] 2.1 Replace the old dark-blue Project Details shell with `AudioFlowScreen`, custom top bar actions, safe-area-aware spacing, and a loading state that does not show the old treatment.
- [x] 2.2 Implement the audio-present hero state using existing `api.getProject(id)` and `api.getAudioTracks(id)` data, including cover/placeholder art, status, title, available metadata, total duration fallback, progress panel, and controls that open the existing player route.
- [x] 2.3 Implement the no-audio creation state as an AudioFlow next-step panel while preserving current `ready_for_tts` CTA behavior and non-ready explanatory copy.
- [x] 2.4 Rebuild the project tools grid as AudioFlow glass tiles that navigate to existing page photos, voice/audio, and sharing routes for the current project.
- [x] 2.5 Preserve project options behavior for edit/delete, including iOS action sheet, Android alert fallback, destructive confirmation, delete API call, and existing route replacements.
- [x] 2.6 Add the AudioFlow footer menu to Project Details with library, create, and current-player actions mapped only to existing routes.

## 3. Tests and Verification

- [x] 3.1 Update `apps/mobile/__tests__/project-detail.test.tsx` for the AudioFlow hero-player state, player route navigation, next-step state, project options, and absence of the old loader treatment.
- [x] 3.2 Add or update assertions for accessible labels on hero-player controls and project tool tiles.
- [x] 3.3 Run the focused mobile Project Details tests and fix regressions.
- [x] 3.4 Run `npm run test:mobile` for the mobile test suite.
- [x] 3.5 Run `npm run lint` and `npm run format:check`, or document any blocker if unrelated existing issues prevent completion.
- [x] 3.6 Manually compare the implemented screen against `design-system/reference-views/Project Details.html`, especially the górny kontener z odtwarzaczem.
