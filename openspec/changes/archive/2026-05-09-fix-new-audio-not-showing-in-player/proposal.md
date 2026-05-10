## Why

Obecnie playlista audiobooka (lista utworów w odtwarzaczu) jest budowana tylko raz, gdy jest pusta. Jeśli użytkownik doda nową scenę i wygeneruje dla niej audio, nowa ścieżka nie pojawia się w odtwarzaczu, ponieważ aplikacja mobilna nie wymusza przebudowania playlisty, a API zwraca zapisaną wcześniej, nieaktualną listę. Powoduje to, że użytkownik nie może odsłuchać nowo dodanych fragmentów książki.

## What Changes

- Zmiana logiki pobierania playlisty w aplikacji mobilnej: wymuszenie przebudowania playlisty, jeśli liczba gotowych ścieżek audio w projekcie różni się od liczby pozycji typu „scene” w aktualnej playliście.
- Opcjonalnie: automatyczne przebudowywanie playlisty po stronie backendu przy wywołaniu `GET /projects/:id/playlist`, jeśli wykryto niespójność (nowe sceny z audio).
- Zapewnienie, że odtwarzacz zawsze prezentuje najbardziej aktualny stan projektu.

## Capabilities

### New Capabilities
- Brak nowych capabilities.

### Modified Capabilities
- `text-to-speech-generation`: dodanie wymagania dotyczącego spójności playlisty z wygenerowanymi ścieżkami audio.

## Impact

- `apps/api`: `routes/playlist.ts` – zmiana logiki `GET /playlist` lub dodanie endpointu sprawdzającego spójność.
- `apps/mobile`: `app/(app)/projects/[id]/player.tsx` – zmiana logiki inicjalizacji playlisty.
- `packages/shared`: ewentualne nowe typy kontraktu, jeśli zajdzie potrzeba.
