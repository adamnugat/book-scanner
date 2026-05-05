## Why

Wygenerowane przez TTS audio nie jest realnie odtwarzalne w aplikacji: na ekranie „Głos i audio” lista wygenerowanych pozycji nie ma żadnego elementu sterującego, a w odtwarzaczu (`apps/mobile/app/(app)/projects/[id]/player.tsx`) `audioUrl` przychodzący z `/projects/:id/playlist` to surowy klucz S3 (`projects/<id>/audio/<uuid>.mp3`), więc `Audio.Sound.createAsync` nie ma czego załadować i odtwarzanie po cichu się nie udaje. Po zakończeniu generacji użytkownik widzi gotową ścieżkę, ale nie może jej odsłuchać ani z poziomu „Głos i audio”, ani po przejściu do odtwarzacza.

## What Changes

- API udostępni autoryzowany endpoint streamujący wygenerowane audio (analogicznie do `images/:id/file?token=...`), wykorzystując asset-token JWT, dzięki czemu plik z S3/MinIO jest dostępny dla zalogowanego właściciela projektu bez upubliczniania bucketa.
- Odpowiedzi `GET /projects/:id/audio-tracks` oraz `GET /projects/:id/playlist` (dla pozycji typu `scene`) będą zwracać pole `audioUrl` z gotowym URL-em opartym o asset-token zamiast surowej ścieżki S3 (`storagePath` zostaje jako pole pomocnicze).
- Aplikacja mobilna doda na ekranie „Głos i audio” przycisk play/pause przy każdej wygenerowanej ścieżce – wykorzystując `expo-av`, z preferencją lokalnego pliku z offline cache, a w razie jego braku strumieniując audio z nowego endpointu.
- Odtwarzacz (`player.tsx`) zacznie korzystać z nowego, prawidłowego `audioUrl` i będzie faktycznie odtwarzać sceny – bez zmian samej UI playera.
- Aktualizacja kontraktów w `packages/shared` (`AudioTrackResponse` z `audioUrl`, `PlaylistItemResponse` bez zmian semantycznych ale z poprawnym znaczeniem `audioUrl`) oraz `AssetTokenPayload` dopuszczający wariant `audio` dla `audioTrackId`.

## Capabilities

### New Capabilities

- (brak)

### Modified Capabilities

- `text-to-speech-generation`: wymóg „Zakładka Głos i audio pokazuje wygenerowane audio” zostaje rozszerzony o możliwość odsłuchania ścieżki bezpośrednio z listy, a jako rozszerzenie pojawia się wymóg dostarczenia odtwarzalnego URL-a audio dla wygenerowanych ścieżek scen.

## Impact

- Workspace `apps/api`: nowy endpoint `GET /projects/:projectId/audio-tracks/:trackId/file?token=...`, rozszerzenie `signAssetToken`/`verifyAssetToken` o wariant `audio`, modyfikacja odpowiedzi w `routes/audio.ts` i `routes/playlist.ts`, testy w `__tests__/audio.test.ts` i ewentualnie `__tests__/playlist.test.ts`.
- Workspace `packages/shared`: rozszerzenie `AudioTrackResponse` o `audioUrl: string`.
- Workspace `apps/mobile`: zmiany w `app/(app)/projects/[id]/voice.tsx` (inline play/pause z `expo-av`, preferencja offline cache, sprzątanie soundu), drobna integracja z `lib/offline-cache.ts` (opcjonalny lookup po `audioTrackId`), testy w `__tests__/voice-audio.test.tsx`. Player (`player.tsx`) zostaje bez zmian logicznych – korzysta z poprawionych URL-i z `/playlist`.
- Brak zmian w schemacie Prisma, w warstwie auth (poza dodatkowym wariantem asset-tokena), w storage S3 ani w providerach TTS/OCR.
- Weryfikacja: `npm run test:api`, `npm run test:mobile`, `npm run lint`, `npm run format:check`.
- Non-goals: nie zmieniamy modelu generacji audio, nie wprowadzamy webhooków, nie rozszerzamy uprawnień (audio tokens nadal tylko dla właściciela projektu, brak dostępu dla viewerów współdzielonych), nie zmieniamy struktury offline cache w sposób niekompatybilny – brak `audioTrackId` w starym manifeście traktujemy jako cache-miss.
