## Context

Obecnie playlista (tabela `PlaylistItem`) jest budowana tylko na żądanie (`POST /build-playlist`) lub przy pierwszym wejściu do odtwarzacza, jeśli jest pusta. Gdy użytkownik doda nową scenę i wygeneruje dla niej audio, playlista staje się nieaktualna. Aplikacja mobilna pobiera istniejącą playlistę przez `GET /playlist`, która nie zawiera nowej ścieżki.

## Goals / Non-Goals

**Goals:**

- Zapewnienie, że odtwarzacz zawsze wyświetla wszystkie wygenerowane w obrębie projektu ścieżki audio.
- Automatyzacja procesu aktualizacji playlisty, aby użytkownik nie musiał ręcznie jej odświeżać.

**Non-Goals:**

- Zmiana struktury tabeli `PlaylistItem`.
- Zmiana logiki samego odtwarzacza audio na froncie.

## Decisions

### 1. Automatyczne przebudowywanie playlisty na backendzie

Zamiast polegać na froncie, backend w punkcie wejścia `GET /projects/:projectId/playlist` sprawdzi spójność danych.

- **Rationale**: Gwarantuje spójność dla wszystkich klientów (mobile, web, public share). Zapobiega błędom, gdy klient zapomni wywołać `build-playlist`.
- **Implementation**: W `apps/api/src/routes/playlist.ts`, przed zwróceniem listy, porównamy `count` scen ze statusem `audio_done` z `count` pozycji `PlaylistItem` typu `scene`. Jeśli się różnią, wywołamy wewnętrzną funkcję budującą playlistę.

### 2. Optymalizacja inicjalizacji w aplikacji mobilnej

W `PlayerScreen` usuniemy warunkowe wywołanie `api.buildPlaylist(id)` tylko gdy lista jest pusta.

- **Rationale**: Skoro backend sam zadba o spójność, front musi tylko pobrać listę. Jeśli jednak chcemy być super bezpieczni, front może zawsze wywoływać `getPlaylist` przy każdym wejściu na ekran (co już robi).

## Risks / Trade-offs

- **[Risk]** Częste przebudowywanie playlisty przy każdym `GET` może być kosztowne.
- **[Mitigation]** Porównanie `count` jest bardzo szybkie (indeksowane pola). Przebudowa nastąpi tylko wtedy, gdy faktycznie doszła nowa scena z audio.
