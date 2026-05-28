## ADDED Requirements

### Requirement: Zmiana wstawki muzycznej projektu wymaga przebudowy playlisty

System SHALL traktować zmianę `interstitialPreset` projektu jako zdarzenie wymagające przebudowy `PlaylistItem`. Operacja `PUT /projects/:id` z nowym `interstitialPreset` MUST zapisać tę wartość w projekcie, ale NIE MOŻE modyfikować rekordów `AudioTrack` ani statusów scen. Klient mobilny MUST wywołać `POST /projects/:id/build-playlist`, aby istniejący odtwarzacz inline (`AudioFlowPlayerPanel`) odzwierciedlił nową wstawkę przy następnym wczytaniu playlisty.

#### Scenario: Zapis nowej wstawki nie modyfikuje AudioTrack

- **WHEN** właściciel projektu wywoła `PUT /projects/:id` ze zmienionym `interstitialPreset`
- **THEN** rekordy `AudioTrack` projektu NIE MOGĄ zostać usunięte ani zmodyfikowane
- **AND** statusy scen NIE MOGĄ ulec zmianie

#### Scenario: Build playlist po zmianie wstawki podmienia interstitial w playliście

- **WHEN** właściciel projektu zmienił `interstitialPreset` i wywoła `POST /projects/:projectId/build-playlist`
- **THEN** nowo zbudowane `PlaylistItem` typu `interstitial` MUSZĄ wskazywać na audio nowej wstawki (`InterstitialPreset.audioUrl`)
- **AND** `PlaylistItem` typu `scene` MUSZĄ pozostać niezmienione w stosunku do stanu sprzed zmiany wstawki

#### Scenario: Odtwarzacz odtwarza nową wstawkę po przebudowie

- **WHEN** użytkownik otwiera ekran szczegółów projektu (lub odtwarzacz) po przebudowie playlisty z nową wstawką
- **THEN** `AudioFlowPlayerPanel` MUSI załadować zaktualizowaną playlistę i odtwarzać nową wstawkę pomiędzy ścieżkami scen
