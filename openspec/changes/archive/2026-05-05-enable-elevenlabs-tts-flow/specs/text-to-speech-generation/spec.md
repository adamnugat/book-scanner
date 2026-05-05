## ADDED Requirements

### Requirement: Katalog głosów jest dostępny po skonfigurowaniu TTS

System SHALL udostępniać zalogowanemu użytkownikowi listę głosów możliwych do użycia w projekcie, uwzględniając język projektu oraz ograniczenia planu użytkownika. Gdy provider ElevenLabs jest aktywny i lokalny katalog `VoiceProfile` nie zawiera pasujących głosów, system MUST zsynchronizować dostępne głosy z ElevenLabs albo zwrócić czytelny błąd konfiguracji.

#### Scenario: Głosy są zwracane z lokalnego katalogu

- **WHEN** użytkownik otwiera zakładkę „Głos i audio” dla projektu, a baza zawiera dostępne `VoiceProfile`
- **THEN** system zwraca głosy pasujące do języka projektu lub głosy wielojęzyczne oraz pokazuje je na liście wyboru

#### Scenario: Pusta baza głosów jest zasilana z ElevenLabs

- **WHEN** `TTS_PROVIDER` ma wartość `elevenlabs`, `ELEVENLABS_API_KEY` jest ustawiony, a lokalna baza nie zawiera dostępnych głosów
- **THEN** system pobiera głosy z ElevenLabs, zapisuje je jako `VoiceProfile` i zwraca je w odpowiedzi listy głosów

#### Scenario: Brak poprawnej konfiguracji ElevenLabs

- **WHEN** użytkownik otwiera zakładkę „Głos i audio”, lokalna baza nie zawiera głosów, a ElevenLabs nie jest poprawnie skonfigurowany
- **THEN** system pokazuje czytelny komunikat, że nie udało się pobrać głosów i że należy sprawdzić konfigurację TTS

### Requirement: Użytkownik może wybrać głos dla projektu

System SHALL pozwalać właścicielowi projektu wybrać jeden głos lektora dla całego projektu przed generowaniem audio. Wybrany głos MUST zostać zapisany w projekcie i użyty dla wszystkich scen generowanych w ramach tego uruchomienia TTS.

#### Scenario: Wybór głosu zapisuje projekt

- **WHEN** właściciel projektu wybiera głos w zakładce „Głos i audio”
- **THEN** system zapisuje identyfikator głosu w projekcie i pokazuje go jako aktualnie wybrany

#### Scenario: Generowanie audio bez głosu jest zablokowane

- **WHEN** właściciel projektu próbuje uruchomić TTS bez wybranego głosu
- **THEN** system nie uruchamia generowania audio i informuje użytkownika, że musi najpierw wybrać głos lektora

### Requirement: Akcja Text to Speech jest widoczna po OCR

System SHALL prezentować jasną akcję uruchomienia Text to Speech, gdy projekt ma zakończony OCR i istnieją sceny gotowe do generowania audio. Jeśli sceny wymagają jeszcze zatwierdzenia tekstu, system MUST wyjaśnić użytkownikowi, co należy zrobić przed uruchomieniem TTS.

#### Scenario: Projekt jest gotowy do TTS

- **WHEN** projekt ma status `ready_for_tts` lub zawiera sceny o statusie `ready_for_audio`
- **THEN** użytkownik widzi akcję prowadzącą do wyboru głosu i generowania audio

#### Scenario: Sceny nie są gotowe do audio

- **WHEN** projekt ma sceny po OCR, ale żadna scena nie ma statusu `ready_for_audio`
- **THEN** system blokuje uruchomienie TTS i pokazuje, że należy najpierw sprawdzić lub zatwierdzić tekst scen

### Requirement: TTS generuje audio dla gotowych scen

System SHALL uruchamiać asynchroniczną generację audio dla scen o statusie `ready_for_audio` po wybraniu głosu przez właściciela projektu. Uruchomienie MUST zwrócić odpowiedź `202`, oznaczyć przetwarzane sceny jako `audio_generating` i nie blokować pozostałych scen, jeśli pojedyncza scena zakończy się błędem.

#### Scenario: Uruchomienie generacji audio

- **WHEN** właściciel projektu z wybranym głosem uruchamia TTS, a projekt ma sceny `ready_for_audio`
- **THEN** system zwraca `202`, oznacza te sceny jako `audio_generating` i rozpoczyna syntezę mowy w tle

#### Scenario: Pomyślna synteza sceny

- **WHEN** provider TTS zwraca poprawny plik audio dla sceny
- **THEN** system zapisuje plik audio w storage, tworzy lub zastępuje `AudioTrack` tej sceny i oznacza scenę jako `audio_done`

#### Scenario: Błąd pojedynczej sceny nie przerywa batcha

- **WHEN** provider TTS zwraca błąd dla jednej sceny podczas generowania wielu scen
- **THEN** system oznacza tę scenę jako `audio_error` i kontynuuje generowanie pozostałych scen

### Requirement: Zakładka Głos i audio pokazuje wygenerowane audio

System SHALL pokazywać w zakładce „Głos i audio” listę wygenerowanych pozycji audio dla projektu oraz aktualne statusy scen związane z generowaniem. Po uruchomieniu TTS aplikacja MUST odświeżyć dane albo pokazać użytkownikowi, gdzie śledzić postęp.

#### Scenario: Projekt ma wygenerowane audio tracks

- **WHEN** projekt posiada `AudioTrack` dla scen
- **THEN** zakładka „Głos i audio” pokazuje listę pozycji audio w kolejności scen wraz z czasem trwania lub rozmiarem, jeśli te dane są dostępne

#### Scenario: Audio jest w trakcie generowania

- **WHEN** co najmniej jedna scena ma status `audio_generating`
- **THEN** zakładka „Głos i audio” pokazuje stan generowania zamiast pustej listy sugerującej brak danych

#### Scenario: Projekt nie ma jeszcze audio

- **WHEN** projekt nie ma `AudioTrack` i żadna scena nie generuje audio
- **THEN** zakładka „Głos i audio” pokazuje pusty stan z następnym krokiem: wybór głosu i uruchomienie TTS albo zatwierdzenie tekstu scen
