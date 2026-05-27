## ADDED Requirements

### Requirement: Tryb inkrementalny `process-ocr-batch` pozostawia ukończone sceny nietknięte

Endpoint `POST /projects/:projectId/process-ocr-batch` wywołany bez `force=true` (lub z `force=false`) SHALL przetwarzać OCR wyłącznie dla scen, które są nowe (utworzone dla obrazów bez powiązanej sceny) lub mają status `queued`/`ocr_error` lub mają `ocrText IS NULL`. Sceny w statusie `ocr_done`, `ready_for_audio`, `needs_review`, `audio_generating`, `audio_done` lub `audio_error` MUST NOT być reprocesowane w tym trybie i ich `ocrText` MUST pozostać niezmieniony.

#### Scenario: Inkrementalny submit pomija sceny ready_for_audio

- **WHEN** projekt zawiera sceny w statusie `ready_for_audio` z istniejącym `ocrText`
- **AND** klient wywołuje `process-ocr-batch` bez `force=true`
- **THEN** te sceny MUST pozostać w statusie `ready_for_audio`
- **AND** ich `ocrText` MUST pozostać niezmieniony
- **AND** nie MUST być wykonywane wywołanie do Google Cloud Vision dla tych scen

#### Scenario: Inkrementalny submit reprocesuje sceny ocr_error

- **WHEN** projekt zawiera sceny w statusie `ocr_error`
- **AND** klient wywołuje `process-ocr-batch` bez `force=true`
- **THEN** te sceny MUST zostać zreprocesowane przez OCR

#### Scenario: Inkrementalny submit tworzy sceny dla nowych obrazów

- **WHEN** projekt zawiera `PageImage` bez powiązanej `Scene`
- **AND** klient wywołuje `process-ocr-batch` bez `force=true`
- **THEN** backend MUST utworzyć nową `Scene` dla każdego takiego obrazu
- **AND** MUST uruchomić OCR dla nowo utworzonych scen
- **AND** sceny istniejące przed wywołaniem ze statusem `ocr_done` MUST nie być reprocesowane

#### Scenario: Tryb force nadal resetuje wszystkie sceny

- **WHEN** klient wywołuje `process-ocr-batch` z `force=true`
- **THEN** wszystkie istniejące sceny projektu MUST zostać zresetowane do statusu `queued` z `ocrText=null` i `editedText=null`
- **AND** OCR MUST zostać uruchomiony dla wszystkich scen

### Requirement: Usunięcie zdjęcia strony sprząta powiązane pliki audio ze storage

Endpoint `DELETE /projects/:projectId/images/:imageId` SHALL usuwać z S3/MinIO wszystkie pliki audio (`AudioTrack.storagePath`) powiązane z kaskadowo usuwanymi scenami przed usunięciem rekordu `PageImage` z bazy danych. Błąd usuwania pliku audio MUST być logowany (`console.warn`) i połykany — usunięcie rekordów DB ma priorytet, aby nie zostawiać sierot w bazie.

#### Scenario: Usuwanie obrazu z powiązanym audio

- **WHEN** klient wywołuje `DELETE /projects/:projectId/images/:imageId` dla obrazu, którego powiązana `Scene` ma `AudioTrack`
- **THEN** backend MUST wywołać `deleteFile(track.storagePath)` dla pliku audio przed usunięciem `PageImage`
- **AND** MUST następnie usunąć `PageImage` (cascade DB usunie `Scene`, `TextRegion`, `AudioTrack`)
- **AND** MUST zwrócić `200 { message: 'Image deleted' }`

#### Scenario: Usuwanie obrazu bez powiązanego audio

- **WHEN** klient wywołuje `DELETE /projects/:projectId/images/:imageId` dla obrazu bez `AudioTrack` (lub w ogóle bez `Scene`)
- **THEN** backend MUST usunąć pliki obrazu i thumbnaila ze storage (jak dotychczas)
- **AND** MUST usunąć `PageImage` z bazy
- **AND** żadne wywołanie `deleteFile` dla audio nie MUST się odbyć

#### Scenario: Błąd S3 przy sprzątaniu audio nie blokuje usunięcia z DB

- **WHEN** `deleteFile(track.storagePath)` rzuca wyjątek (S3 niedostępne lub plik nie istnieje)
- **THEN** backend MUST zalogować ostrzeżenie
- **AND** MUST kontynuować i usunąć `PageImage` z bazy
- **AND** MUST zwrócić `200 { message: 'Image deleted' }`
