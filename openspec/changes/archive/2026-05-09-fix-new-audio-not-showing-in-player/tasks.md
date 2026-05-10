## 1. Backend: Playlist Auto-rebuild

- [x] 1.1 Wyodrębnienie logiki budowania playlisty do reużywalnej funkcji w `apps/api/src/routes/playlist.ts`.
- [x] 1.2 Modyfikacja `GET /projects/:projectId/playlist` w `apps/api/src/routes/playlist.ts`: dodanie sprawdzenia spójności (liczba `AudioTrack` vs liczba `PlaylistItem`) i automatyczne wywołanie przebudowy.
- [x] 1.3 Dodanie testu w `apps/api/__tests__/playlist.test.ts` weryfikującego automatyczną aktualizację playlisty po dodaniu nowej ścieżki audio.

## 2. Mobile: Player Screen Update

- [x] 2.1 Modyfikacja `apps/mobile/app/(app)/projects/[id]/player.tsx`: uproszczenie inicjalizacji playlisty (usunięcie warunkowego `api.buildPlaylist`).
- [x] 2.2 Weryfikacja działania odtwarzacza po dodaniu nowej sceny i wygenerowaniu audio.

## 3. Verification

- [x] 3.1 Uruchomienie testów API: `npm run test:api`.
- [x] 3.2 Uruchomienie testów mobile: `npm run test:mobile`.
- [x] 3.3 Uruchomienie lintera i sprawdzenie formatowania: `npm run lint && npm run format:check`.
