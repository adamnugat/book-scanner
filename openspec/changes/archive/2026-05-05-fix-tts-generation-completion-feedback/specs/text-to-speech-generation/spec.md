## MODIFIED Requirements

### Requirement: Zakładka Głos i audio pokazuje wygenerowane audio

System SHALL pokazywać w zakładce „Głos i audio” listę wygenerowanych pozycji audio dla projektu oraz aktualne statusy scen związane z generowaniem. Po uruchomieniu TTS aplikacja MUST aktywnie odświeżać dane scen i ścieżek audio dopóki istnieją sceny w statusie `audio_generating`, a po zakończeniu generacji MUST zaprezentować użytkownikowi jednoznaczny komunikat zakończenia (sukces lub częściowe błędy) bez konieczności ręcznego ponownego otwarcia zakładki. Aktualizacja MUST przestać generować ruch sieciowy, gdy żadna scena projektu nie jest już w statusie `audio_generating` albo gdy ekran traci focus.

#### Scenario: Projekt ma wygenerowane audio tracks

- **WHEN** projekt posiada `AudioTrack` dla scen
- **THEN** zakładka „Głos i audio” pokazuje listę pozycji audio w kolejności scen wraz z czasem trwania lub rozmiarem, jeśli te dane są dostępne

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
