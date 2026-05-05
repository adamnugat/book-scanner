## Context

Po zakończeniu generacji audio (TTS przez ElevenLabs) backend zapisuje plik do S3/MinIO z kluczem `projects/<projectId>/audio/<uuid>.mp3` (`apps/api/src/routes/audio.ts`) i tworzy `AudioTrack` w Prisma. `GET /projects/:id/audio-tracks` zwraca jednak tylko `storagePath`, a `GET /projects/:id/playlist` ustawia `audioUrl = track.storagePath`. Plik nie jest publicznie dostępny (MinIO bez public bucket), nie ma też endpointu strumieniującego, więc nic, co wskazuje `expo-av`, nie zagra.

Zdjęcia stron rozwiązują ten sam problem przez parę endpointów `images/:imageId/file?token=...` i `images/:imageId/thumbnail?token=...`, gdzie URL jest budowany przez backend z asset-tokena (JWT podpisany `JWT_SECRET`, krótka ważność `JWT_ASSET_EXPIRES_IN`). Asset-token zawiera `userId`, `projectId`, `imageId`, `variant`. Endpoint pobierający strumień weryfikuje token i sprawdza, czy projekt należy do użytkownika z tokena.

Po stronie mobile mamy `expo-av` (`Audio.Sound.createAsync`) używane w odtwarzaczu i `lib/offline-cache.ts`, które zapisuje pliki audio per `playlistItem.id` razem z `localUri`. Cache nie indeksuje obecnie `audioTrackId`, więc lookup z poziomu listy ścieżek wymaga drobnego rozszerzenia.

## Goals / Non-Goals

**Goals:**

- Wygenerowane audio jest faktycznie odtwarzalne w aplikacji – zarówno w odtwarzaczu (już istniejącym), jak i bezpośrednio z ekranu „Głos i audio”.
- Plik audio jest dostępny tylko dla zalogowanego właściciela projektu, na tej samej zasadzie co obrazy stron (asset-token JWT, krótkie TTL).
- Inline play na ekranie głosu preferuje plik z offline cache, gdy istnieje, by unikać niepotrzebnego ruchu sieciowego.
- Brak regresji: nie psujemy odtwarzacza, listy głosów, przepływu generacji ani offline cache dla starych projektów.

**Non-Goals:**

- Nie rozszerzamy dostępu do audio na użytkowników z udostępnieniem typu viewer (`ProjectShare`) – to osobna decyzja produktowa.
- Nie zmieniamy schematu `AudioTrack` w Prisma ani struktury bucketów.
- Nie wprowadzamy publicznych URL-i ani presigned URL-i z S3 – pozostajemy przy strumieniowaniu przez nasz backend (spójność z obrazami).
- Nie przebudowujemy UI odtwarzacza, sterowania ani globalnego cache.

## Decisions

### Streamowanie przez własny endpoint zamiast presigned URL S3

**Decyzja:** Dodajemy `GET /projects/:projectId/audio-tracks/:trackId/file?token=...`, który weryfikuje asset-token, sprawdza ownership projektu i streamuje plik z S3 przez `downloadFileWithMetadata` (lub strumień), ustawiając `Content-Type: audio/mpeg` i `Cache-Control: private, max-age=300`.

**Alternatywy:**

- Presigned URL prosto z S3 → wymaga dodatkowej konfiguracji bucketu i nie działa dla MinIO bez sygnatury v4 zgodnej z klientem; spójność z istniejącą warstwą obrazów jest ważniejsza.
- Publiczne URL-e → łamie obecny model prywatności projektu.

**Rationale:** Spójność z istniejącym wzorcem `images/:imageId/file`, mniej kodu, natychmiastowa kompatybilność z MinIO i z autoryzowaną architekturą REST.

### Asset-token z wariantem `audio` i polem `audioTrackId`

**Decyzja:** Rozszerzam `AssetTokenPayload` w `apps/api/src/lib/jwt.ts`:

- pole `variant` przyjmuje też `'audio'`,
- nowe opcjonalne pole `audioTrackId?: string` używane wyłącznie dla wariantu `'audio'`,
- pole `imageId` pozostaje opcjonalne i wymagane tylko dla `'file' | 'thumbnail'`.

`signAssetToken` i `verifyAssetToken` nie wymagają zmian poza typami; runtime walidacja w endpointach sprawdza spójność: dla `variant === 'audio'` musi się zgadzać `audioTrackId` i `projectId` z tokena oraz parametry trasy.

**Alternatywy:**

- Osobna funkcja `signAudioAssetToken` z dedykowanym typem → więcej duplikacji bez wartości dodanej.

### Kontrakt API

**Decyzja:**

- `AudioTrackResponse` w `packages/shared` dostaje `audioUrl: string` (pełny URL z asset-tokena).
- `GET /projects/:id/audio-tracks` buduje `audioUrl` per track w czasie odpowiedzi (token ważny ~1h zgodnie z `JWT_ASSET_EXPIRES_IN`).
- `GET /projects/:id/playlist` dla pozycji `type === 'scene'` ustawia `audioUrl` analogicznie (nie surową `storagePath`). Pozycje `type === 'interstitial'` zachowują `preset.audioUrl` jak dziś.
- `storagePath` zostaje w `AudioTrackResponse` jako pole pomocnicze – nie usuwamy, by nie psuć ewentualnych integracji.

**Alternatywy:**

- Generowanie URL-a po stronie klienta → klient musiałby znać sekret asset-tokena lub mieć osobny endpoint do podpisu, co nic nie daje.

### Inline play na ekranie głosu

**Decyzja:** W `voice.tsx` dodajemy stan `playingTrackId: string | null` oraz `Audio.Sound` w `useRef`. Przycisk play/pause przy każdej pozycji `AudioTrack`:

1. Jeśli już gra → pauza i `unloadAsync` na unmount.
2. W przeciwnym razie próbujemy znaleźć lokalny plik z offline cache przez `offlineCache.getCachedAudioForTrack(projectId, trackId)` (nowy helper). Jeśli istnieje, używamy `localUri`.
3. W przeciwnym razie używamy `track.audioUrl` z odpowiedzi `getAudioTracks`.
4. Tylko jedna ścieżka gra w danym momencie – przed nową, robimy `unloadAsync` poprzedniej.
5. `useFocusEffect` cleanup → `unloadAsync` przy opuszczeniu ekranu.

`offlineCache.getCachedAudioForTrack(projectId, trackId)` skanuje istniejący manifest i zwraca pierwszą pozycję, której `audioTrackId === trackId` (po uprzedniej rozbudowie cache o to pole) lub `null`. Dla starych manifestów bez `audioTrackId` zwraca `null` – traktujemy jako cache-miss, brak regresji.

**Alternatywy:**

- Dedykowany hook globalny do pojedynczego soundu między ekranami → przerost na MVP, player i tak ma własny `Audio.Sound`.
- Kasowanie i pobieranie cache przy starcie → poza zakresem.

### Rozbudowa offline cache o `audioTrackId`

**Decyzja:** Do `CacheEntry.items` dodajemy opcjonalne `audioTrackId?: string`. Podczas budowania cache w `downloadProject` zapisujemy je dla pozycji `type === 'scene'` (referenceId to id `playlistItem`, ale `playlistItem.referenceId` to id `audioTrack` – wykorzystujemy je z parametru `playlist`). Stary manifest pozostaje czytelny – nowe pole jest `optional`.

**Alternatywy:**

- Osobna mapa `trackId → localUri` → duplikacja danych.

### Strategia testowa

- **API**: nowe testy w `apps/api/__tests__/audio.test.ts`:
  - `GET /audio-tracks` zwraca pole `audioUrl` z poprawnym tokenem dla właściciela.
  - `GET /audio-tracks/:trackId/file?token=...` z poprawnym tokenem zwraca 200 + `Content-Type: audio/mpeg`.
  - Brak/nieprawidłowy token → 401.
  - Token z innego projektu lub innego użytkownika → 403.
  - Track nieistniejący lub spoza projektu → 404.
- **API**: w `apps/api/__tests__/playlist.test.ts` rozszerzamy assert: pozycje typu `scene` zwracają `audioUrl` zaczynający się od ścieżki `/audio-tracks/.../file?token=`.
- **Mobile**: `apps/mobile/__tests__/voice-audio.test.tsx`:
  - tap play wywołuje `Audio.Sound.createAsync` z URL-em z mocka.
  - tap play, gdy offline cache zawiera ścieżkę z `audioTrackId`, używa `localUri`.
  - tap pause na grającej ścieżce wywołuje `pauseAsync` i czyści stan.
  - opuszczenie ekranu wywołuje `unloadAsync`.

## Risks / Trade-offs

- [Asset-token wygasa po ~1h, polling po `getAudioTracks` przedłuża żywotność] → Mitygacja: na ekranie głosu po starcie generacji i tak mamy polling oraz refresh listy; przy odsłuchu odświeżamy URL przy każdym pobraniu listy; gdy URL wygaśnie w trakcie odtwarzania, kolejny tap play pobierze świeży URL.
- [Cache offline starych projektów nie ma `audioTrackId`] → Mitygacja: traktujemy jako cache-miss i pobieramy z API; user nie widzi błędu, tylko brak skrótu offline.
- [Strumieniowanie przez Express ładuje cały plik do pamięci (`downloadFileWithMetadata`)] → Mitygacja w MVP: pliki audio scen są małe (kilka–kilkanaście KB do paru MB); jeśli to się zmieni, opcjonalnie przejdziemy na prawdziwy stream w kolejnej iteracji. Poza zakresem.
- [Token tylko dla właściciela – viewer udostępniony nie odtworzy audio] → Świadoma decyzja, zgodna z aktualnym modelem (viewerzy mają teraz dostęp tylko do read-only metadanych przez sharing). Poza zakresem.
- [Nieprawidłowe URL-e w cache offline po zmianie tokena] → cache zapisuje `audioUrl` jako stabilny `localUri`; `audioUrl` jest używany tylko jako klucz źródła; brak ryzyka.
