## 1. Backend voices and TTS contracts

- [x] 1.1 Add a TTS voice-listing helper that can fetch voices from ElevenLabs when `TTS_PROVIDER=elevenlabs` and `ELEVENLABS_API_KEY` is configured.
- [x] 1.2 Extend `GET /voices` to return existing `VoiceProfile` records first and synchronize from ElevenLabs when the filtered local result is empty.
- [x] 1.3 Preserve plan and language filtering for synchronized voices, including a safe default availability policy for newly created `VoiceProfile` records.
- [x] 1.4 Return standard `{ error, message, statusCode }` errors when voices cannot be loaded because ElevenLabs is misconfigured or unavailable and no local fallback exists.
- [x] 1.5 Add API tests for local voices, empty-local ElevenLabs sync, missing provider configuration, and existing language/plan filtering.

## 2. Backend audio generation behavior

- [x] 2.1 Review `POST /projects/:projectId/generate-audio` idempotency and keep existing behavior for selected voice validation, `ready_for_audio` scenes, replacement of old `AudioTrack`, and partial scene failures.
- [x] 2.2 Ensure audio generation responses and scene status updates give mobile enough data to distinguish `audio_generating`, `audio_done`, and `audio_error`.
- [x] 2.3 Add or update API tests for re-generation, partial TTS failure, and completed project status after background generation finishes.

## 3. Mobile project flow

- [x] 3.1 Add a visible Text to Speech call-to-action on the project details flow when the project is `ready_for_tts` or has scenes ready for audio.
- [x] 3.2 Make the CTA route users to „Głos i audio” and explain the next step when scenes still need text review or approval.
- [x] 3.3 Add focused mobile tests for the post-OCR CTA visibility and disabled/explanatory state.

## 4. Mobile Głos i audio screen

- [x] 4.1 Load project details, voices, scenes or scene statuses, and audio tracks needed to render the full voice/audio state.
- [x] 4.2 Show voice loading, empty, and error states that distinguish no voices for language/plan from TTS configuration or provider failures.
- [x] 4.3 Keep project-level voice selection and save the chosen `elevenlabsVoiceId` to the project.
- [x] 4.4 Show a clear `Generuj audio` action only when a voice is selected and at least one scene is `ready_for_audio`.
- [x] 4.5 After `api.generateAudio(projectId)` returns `202`, refresh scene/audio state or show a progress state for `audio_generating`.
- [x] 4.6 Render existing `AudioTrack` rows in scene order with useful metadata such as duration and file size.
- [x] 4.7 Add focused Jest tests for voice loading states, generate button enablement, generation success, generation error, and audio-track rendering.

## 5. Shared contracts and documentation

- [x] 5.1 Extend shared request/response types only if the existing `VoiceResponse`, `SceneResponse`, and `AudioTrackResponse` contracts are insufficient for the UI.
- [x] 5.2 Document any new ElevenLabs voice synchronization environment behavior in `.env.example` or project docs without committing secrets.
- [x] 5.3 Confirm no Prisma schema migration is needed; if implementation requires new persisted fields, add and test a migration.

## 6. Verification

- [x] 6.1 Run `npm run test:api`.
- [x] 6.2 Run `npm run test:mobile`.
- [x] 6.3 Run `npm run lint`.
- [x] 6.4 Run `npm run format:check`.
- [x] 6.5 Run `npm run build:api`.
