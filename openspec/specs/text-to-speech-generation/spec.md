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

### Requirement: Wygenerowane audio jest dostępne do odtworzenia przez autoryzowany URL

System SHALL udostępniać wygenerowany plik audio sceny przez autoryzowany URL z asset-tokenem JWT, dostępny tylko dla zalogowanego właściciela projektu. Odpowiedzi `GET /projects/:projectId/audio-tracks` oraz `GET /projects/:projectId/playlist` (dla pozycji typu `scene`) MUST zawierać pole `audioUrl` z pełnym URL-em opartym o ten endpoint, a nie surową ścieżkę storage.

#### Scenario: Lista ścieżek audio zawiera odtwarzalny URL

- **WHEN** właściciel projektu pobiera listę `GET /projects/:projectId/audio-tracks`
- **THEN** każda pozycja zawiera `audioUrl` zaczynający się od `/projects/:projectId/audio-tracks/<trackId>/file?token=...` (lub jego pełnej formy z `host`)

#### Scenario: Playlista zwraca odtwarzalny URL dla pozycji scen

- **WHEN** właściciel projektu pobiera `GET /projects/:projectId/playlist`, a projekt ma sceny z gotowym audio
- **THEN** każda pozycja typu `scene` zawiera `audioUrl` zaczynający się od `/projects/:projectId/audio-tracks/<trackId>/file?token=...`

#### Scenario: Endpoint pliku audio strumienuje plik dla właściciela

- **WHEN** zalogowany właściciel projektu wysyła `GET /projects/:projectId/audio-tracks/:trackId/file?token=<valid asset token>`
- **THEN** API zwraca status `200`, `Content-Type` zaczynający się od `audio/`, ciało odpowiedzi zawiera dane pliku z storage

#### Scenario: Brak tokena lub niepoprawny token jest odrzucany

- **WHEN** klient wywołuje `GET /projects/:projectId/audio-tracks/:trackId/file` bez parametru `token` lub z tokenem nieprawidłowym/wygasłym
- **THEN** API zwraca `401` z payloadem `{ error: 'Unauthorized', message, statusCode: 401 }`

#### Scenario: Token z niepasującym projektem lub trackiem jest odrzucany

- **WHEN** klient wywołuje `GET /projects/:projectId/audio-tracks/:trackId/file?token=...`, a token został wystawiony dla innego projektu, innego tracka albo innego użytkownika
- **THEN** API zwraca `403` z payloadem `{ error: 'Forbidden', message, statusCode: 403 }`

#### Scenario: Track nieistniejący lub spoza projektu

- **WHEN** klient wywołuje `GET /projects/:projectId/audio-tracks/:trackId/file?token=...` dla tracka, który nie istnieje albo należy do scen innego projektu
- **THEN** API zwraca `404` z payloadem `{ error: 'Not Found', message, statusCode: 404 }`

### Requirement: Zakładka Głos i audio pokazuje wygenerowane audio

System SHALL pokazywać w zakładce „Głos i audio” listę wygenerowanych pozycji audio dla projektu oraz aktualne statusy scen związane z generowaniem. Po uruchomieniu TTS aplikacja MUST aktywnie odświeżać dane scen i ścieżek audio dopóki istnieją sceny w statusie `audio_generating`, a po zakończeniu generacji MUST zaprezentować użytkownikowi jednoznaczny komunikat zakończenia (sukces lub częściowe błędy) bez konieczności ręcznego ponownego otwarcia zakładki. Aktualizacja MUST przestać generować ruch sieciowy, gdy żadna scena projektu nie jest już w statusie `audio_generating` albo gdy ekran traci focus. Każda pozycja audio na liście MUST udostępniać interaktywny przycisk play/pause pozwalający odtworzyć tę ścieżkę bezpośrednio z ekranu, z preferencją użycia lokalnego pliku z offline cache, jeżeli jest dostępny dla danego `audioTrackId`.

#### Scenario: Projekt ma wygenerowane audio tracks

- **WHEN** projekt posiada `AudioTrack` dla scen
- **THEN** zakładka „Głos i audio” pokazuje listę pozycji audio w kolejności scen wraz z czasem trwania lub rozmiarem, jeśli te dane są dostępne, oraz przyciskiem play/pause obok każdej pozycji

#### Scenario: Audio jest w trakcie generowania

- **WHEN** co najmniej jedna scena ma status `audio_generating`
- **THEN** zakładka „Głos i audio” pokazuje stan generowania zamiast pustej listy sugerującej brak danych

#### Scenario: Projekt nie ma jeszcze audio

- **WHEN** projekt nie ma `AudioTrack` i żadna scena nie generuje audio
- **THEN** zakładka „Głos i audio” pokazuje pusty stan z następnym krokiem: wybór głosu i uruchomienie TTS albo zatwierdzenie tekstu scen

#### Scenario: Aplikacja aktywnie odświeża stan podczas generacji

- **WHEN** użytkownik pozostaje na ekranie „Głos i audio”, a co najmniej jedna scena projektu ma status `audio_generating`
- **THEN** aplikacja okresowo (interwał krótszy niż 10 s) odpytuje API o aktualne sceny oraz ścieżki audio i aktualizuje widoczne liczniki oraz listę audio bez interakcji użytkownika

#### Scenario: Komunikat sukcesu po zakończeniu generacji

- **WHEN** wszystkie sceny brane do batcha zmieniają status z `audio_generating` na `audio_done`, a użytkownik jest na ekranie „Głos i audio”
- **THEN** aplikacja pokazuje jednoznaczny komunikat zakończenia generacji oraz odświeżoną listę nowych `AudioTrack`, a następnie zatrzymuje aktywne odświeżanie

#### Scenario: Komunikat o częściowych błędach

- **WHEN** generacja batcha kończy się tak, że co najmniej jedna scena ma status `audio_error`, a żadna scena nie ma już statusu `audio_generating`
- **THEN** aplikacja informuje użytkownika o liczbie scen z błędem i sugeruje ponowne uruchomienie generacji dla scen `audio_error`, a następnie zatrzymuje aktywne odświeżanie

#### Scenario: Aktywne odświeżanie zatrzymuje się po opuszczeniu ekranu

- **WHEN** użytkownik opuszcza ekran „Głos i audio” lub komponent zostaje odmontowany podczas aktywnego odświeżania
- **THEN** aplikacja przerywa kolejne wywołania pollingu i nie wykonuje już zaplanowanych odświeżeń dla tego projektu

#### Scenario: Inline odtwarzanie z listy

- **WHEN** użytkownik klika przycisk play przy pozycji audio na liście „Wygenerowane audio”
- **THEN** aplikacja rozpoczyna odtwarzanie wybranej ścieżki, a przycisk zmienia się w pause; kolejny klik wstrzymuje odtwarzanie i nie rozpoczyna pobierania nowego soundu

#### Scenario: Inline odtwarzanie korzysta z offline cache, gdy jest dostępne

- **WHEN** użytkownik klika play, a w offline cache projektu znajduje się lokalny plik z `audioTrackId` zgodnym z wybraną ścieżką
- **THEN** aplikacja używa lokalnego URI z cache zamiast wywoływać sieć

#### Scenario: Inline odtwarzanie sprząta po opuszczeniu ekranu

- **WHEN** użytkownik opuszcza ekran „Głos i audio” podczas odtwarzania
- **THEN** aplikacja zatrzymuje odtwarzanie i zwalnia zasoby `Audio.Sound`, a po powrocie na ekran nie odtwarza automatycznie poprzedniej ścieżki
