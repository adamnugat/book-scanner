## ADDED Requirements

### Requirement: Zmiana lektora projektu inwalidacje wygenerowane audio

System SHALL traktować zmianę `voiceId` projektu jako event inwalidacji wszystkich istniejących audio tracków tego projektu. Gdy żądanie `PUT /projects/:id` zawiera `voiceId` różny od bieżącego `project.voiceId`, backend MUST: (1) usunąć obiekty storage wszystkich `AudioTrack` powiązanych ze scenami projektu, (2) usunąć rekordy `AudioTrack` z bazy, (3) zresetować status scen ze stanów `audio_done`, `audio_error`, `audio_generating` do `ready_for_audio`, (4) usunąć rekordy `PlaylistItem` projektu (playlist będzie odbudowany przy następnym `buildPlaylist`). Operacje DB MUST być uruchamiane w transakcji; błędy `deleteFile` w storage MUSZĄ być logowane jako warning bez przerywania operacji DB.

#### Scenario: Zmiana voiceId resetuje sceny audio_done

- **WHEN** właściciel projektu wywoła `PUT /projects/:id` z `voiceId` różnym od bieżącego, a sceny mają status `audio_done`
- **THEN** sceny MUSZĄ otrzymać status `ready_for_audio`
- **AND** wszystkie rekordy `AudioTrack` powiązane z tymi scenami MUSZĄ zostać usunięte z bazy

#### Scenario: Zmiana voiceId usuwa pliki storage

- **WHEN** właściciel projektu zmienia `voiceId` projektu z istniejącymi `AudioTrack`
- **THEN** dla każdego `AudioTrack.storagePath` MUSI zostać wywołane `deleteFile`
- **AND** błąd `deleteFile` dla pojedynczego pliku MUSI zostać zalogowany jako `console.warn` i NIE MOŻE przerywać operacji

#### Scenario: Zmiana voiceId resetuje sceny audio_generating

- **WHEN** właściciel projektu zmienia `voiceId` w trakcie generacji audio (sceny `audio_generating`)
- **THEN** te sceny MUSZĄ otrzymać status `ready_for_audio`
- **AND** odpowiedź `PUT /projects/:id` MUSI zwrócić zaktualizowany `ProjectResponse` z nowym `voiceId`

#### Scenario: Zmiana voiceId usuwa pozycje playlisty

- **WHEN** właściciel projektu zmienia `voiceId`, a projekt ma istniejące `PlaylistItem`
- **THEN** wszystkie `PlaylistItem` projektu MUSZĄ zostać usunięte

#### Scenario: Update bez zmiany voiceId nie ingeruje w audio

- **WHEN** właściciel projektu wywoła `PUT /projects/:id` z `voiceId` równym bieżącemu (lub bez tego pola w body)
- **THEN** `AudioTrack`, statusy scen audio i `PlaylistItem` NIE MOGĄ zostać zmodyfikowane

#### Scenario: Update voiceId nie ingeruje w sceny przed audio

- **WHEN** właściciel projektu zmienia `voiceId`, a sceny mają status `ocr_done`, `needs_review` lub `ready_for_audio`
- **THEN** statusy tych scen NIE MOGĄ ulec zmianie (pozostają takie same)

### Requirement: Zmiana lektora skutkuje pełną regeneracją audio przy następnym TTS

System SHALL pozwalać na uruchomienie `POST /projects/:projectId/generate-audio` bezpośrednio po zmianie `voiceId`, bez konieczności ponownego OCR. Endpoint MUST objąć wszystkie sceny o statusie `ready_for_audio` (w tym te zresetowane przez zmianę głosu) i wygenerować dla nich nowe audio z nowym głosem.

#### Scenario: Generate audio obejmuje sceny zresetowane przez zmianę głosu

- **WHEN** właściciel projektu zmienił `voiceId` (sceny zresetowane do `ready_for_audio`) i wywoła `POST /projects/:projectId/generate-audio`
- **THEN** wszystkie zresetowane sceny MUSZĄ być objęte batchem TTS z nowym `voiceId`
- **AND** odpowiedź MUSI zwrócić `202` ze zaktualizowaną listą scen
