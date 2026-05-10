## ADDED Requirements

### Requirement: Playlista musi być spójna z wygenerowanymi ścieżkami audio
System SHALL zapewniać, że playlista projektu zawiera wszystkie wygenerowane ścieżki audio dla scen o statusie `audio_done`. Jeśli po wygenerowaniu nowego audio playlista nie została jeszcze zaktualizowana, system MUST automatycznie ją przebudować przed udostępnieniem jej użytkownikowi w odtwarzaczu.

#### Scenario: Pobranie playlisty po wygenerowaniu nowej ścieżki
- **WHEN** użytkownik pobiera `GET /projects/:projectId/playlist`, a liczba gotowych ścieżek `AudioTrack` jest większa niż liczba pozycji `scene` w aktualnej playliście
- **THEN** system automatycznie wywołuje logikę przebudowania playlisty i zwraca zaktualizowaną listę zawierającą nową ścieżkę
