## 1. Backend – endpoint streamujący audio i URL-e w odpowiedziach

- [x] 1.1 W `apps/api/src/lib/jwt.ts` rozszerzyć `AssetTokenPayload` o wariant `'audio'` i opcjonalne pole `audioTrackId?: string`; pole `imageId` zrobić opcjonalnym.
- [x] 1.2 W `apps/api/src/routes/audio.ts` dodać helper `buildAudioTrackUrl(req, projectId, trackId, userId)` budujący `audioUrl` na bazie `signAssetToken({ variant: 'audio', userId, projectId, audioTrackId })` i pełnego `host` z requesta; użyć go w `GET /projects/:projectId/audio-tracks` i w `playlist.ts`.
- [x] 1.3 Dodać endpoint `audioRouter.get('/audio-tracks/:trackId/file', ...)` z weryfikacją asset-tokena (variant `audio`, projectId, audioTrackId), ownership projektu, strumieniowaniem przez `downloadFileWithMetadata` i `Cache-Control: private, max-age=300`.
- [x] 1.4 W `apps/api/src/routes/playlist.ts` dla pozycji `type === 'scene'` ustawić `audioUrl` z `buildAudioTrackUrl` zamiast surowej `track.storagePath`; `interstitial` zostaje na `preset.audioUrl`.
- [x] 1.5 W `packages/shared/src/types.ts` rozszerzyć `AudioTrackResponse` o `audioUrl: string`.
- [x] 1.6 (dodatkowe, znalezione w trakcie) Przesunąć `app.use('/projects/:projectId', audioRouter)` w `apps/api/src/app.ts` przed `app.use('/projects', projectsRouter)`, żeby `requireAuth` z projectsRouter nie blokował niezalogowanego asset-tokenowego streama.

## 2. Backend – testy

- [x] 2.1 W `apps/api/__tests__/audio.test.ts` rozszerzyć test listy ścieżek o assert `audioUrl` zaczynający się od `/audio-tracks/<id>/file?token=...`.
- [x] 2.2 Dodać test: `GET /projects/:projectId/audio-tracks/:trackId/file?token=<valid>` zwraca `200`, `Content-Type` zaczynający się od `audio/`, `body` to bufor z mocka storage.
- [x] 2.3 Dodać test: brak tokena → `401`, niepoprawny token → `401`.
- [x] 2.4 Dodać test: token z innego projektu/usera → `403`; token niewłaściwego wariantu → `403`.
- [x] 2.5 Dodać test: track spoza projektu albo nieistniejący → `404`.
- [x] 2.6 W `apps/api/__tests__/playlist.test.ts` rozszerzyć assert: pozycje typu `scene` mają `audioUrl` zaczynający się od `/projects/.../audio-tracks/.../file?token=`.

## 3. Mobile – inline play na ekranie „Głos i audio”

- [x] 3.1 W `apps/mobile/lib/offline-cache.ts` rozszerzyć `CacheEntry.items` o opcjonalne `audioTrackId?: string` i wypełniać je w `downloadProject` na podstawie `playlist[i].referenceId` dla pozycji typu `scene`.
- [x] 3.2 W `apps/mobile/lib/offline-cache.ts` dodać `getCachedAudioForTrack(projectId, audioTrackId)` zwracające `{ localUri } | null` (graceful fallback dla starych manifestów bez `audioTrackId` → `null`).
- [x] 3.3 W `apps/mobile/app/(app)/projects/[id]/voice.tsx` dodać stan `playingTrackId`, `useRef<Audio.Sound | null>` i przycisk play/pause obok każdej pozycji `AudioTrack`.
- [x] 3.4 Zaimplementować `handlePlayTrack`: pauza tego samego, `unloadAsync` poprzedniego, lookup w `offlineCache.getCachedAudioForTrack`, fallback na `track.audioUrl`, `Audio.Sound.createAsync({ uri }, { shouldPlay: true }, onStatus)`; po `didJustFinish` reset stanu.
- [x] 3.5 Cleanup soundu w `useFocusEffect` i `useEffect` (unmount) – `unloadAsync` przy opuszczeniu ekranu.
- [x] 3.6 Zachować istniejące style i etykiety listy „Wygenerowane audio”; dodać przycisk wpisany w istniejące `audioCard`.

## 4. Mobile – testy

- [x] 4.1 W `apps/mobile/__tests__/voice-audio.test.tsx` dodać mock `expo-av` (`Audio.Sound.createAsync`, `setAudioModeAsync`) i `lib/offline-cache` (`getCachedAudioForTrack`).
- [x] 4.2 Dodać test: po naciśnięciu play `Audio.Sound.createAsync` jest wołane z `audioUrl` zwróconym przez `getAudioTracks` (cache pusty).
- [x] 4.3 Dodać test: gdy mock cache zwraca `localUri`, `Audio.Sound.createAsync` jest wołane z `localUri` zamiast `audioUrl`.
- [x] 4.4 Dodać test: drugi tap na grający track wywołuje `pauseAsync` i nie tworzy nowego soundu.
- [x] 4.5 Dodać test: tap na inny track w trakcie odtwarzania wywołuje `unloadAsync` poprzedniego soundu i `createAsync` z URL-em nowego.

## 5. Player – sanity check

- [x] 5.1 Zweryfikowane: `apps/mobile/app/(app)/projects/[id]/player.tsx` używa `playlist[index].audioUrl`. Po zmianie kontraktu `audioUrl` z `/playlist` jest realnym URL-em z asset-tokenem, więc odtwarzacz zaczyna grać bez zmian w UI.
- [x] 5.2 Zweryfikowane: ścieżka `offlineCache` w odtwarzaczu (`localUri` z `cached.items`) nadal działa; `audioUrl` w cache pozostaje, `audioTrackId` jest dodatkiem opcjonalnym.

## 6. Weryfikacja

- [x] 6.1 `npm run test:api` – 121 testów przechodzi (był 112, +9 dla audio assets).
- [x] 6.2 `npm run test:mobile` – 30 testów przechodzi (było 26, +4 dla inline play).
- [x] 6.3 `npm run lint` – bez błędów; `npm run format:check` – pliki edytowane sformatowane.
- [x] 6.4 Manualnie: po wygenerowaniu TTS na ekranie „Głos i audio” kliknąć play przy pozycji audio – ścieżka odtwarza się; przejść do odtwarzacza – sceny grają sekwencyjnie.
