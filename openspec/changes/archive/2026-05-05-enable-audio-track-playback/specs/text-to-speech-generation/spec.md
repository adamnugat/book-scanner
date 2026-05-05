## ADDED Requirements

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

## MODIFIED Requirements

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
