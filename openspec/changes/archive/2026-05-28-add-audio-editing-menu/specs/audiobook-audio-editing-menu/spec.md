## ADDED Requirements

### Requirement: Przycisk "Audio" w pasku akcji ekranu edycji audiobooka

Pasek akcji (settings bar) ekranu `/(app)/projects/[id]/images` SHALL zawierać trzeci element nawigacyjny "Audio" obok przycisków "Obszary" i "Korekta OCR". Element MUST być renderowany w tym samym kontenerze co istniejące toggle (`styles.toggles`) i wyświetlany wyłącznie gdy projekt zawiera co najmniej jedno zdjęcie strony.

#### Scenario: Przycisk "Audio" jest widoczny obok pozostałych

- **WHEN** użytkownik otwiera ekran edycji audiobooka projektu z co najmniej jednym zdjęciem
- **THEN** pasek akcji MUSI zawierać trzy elementy w kolejności: "Obszary", "Korekta OCR", "Audio"
- **AND** przycisk "Audio" MUSI mieć `accessibilityLabel="Edycja audio"` i ikonę audio (np. `Feather` `mic` lub `music`)

#### Scenario: Brak przycisku gdy projekt jest pusty

- **WHEN** użytkownik otwiera ekran edycji audiobooka projektu bez zdjęć
- **THEN** pasek akcji NIE MOŻE być renderowany (wraz z przyciskiem "Audio")

#### Scenario: Tap otwiera menu audio

- **WHEN** użytkownik tapnie przycisk "Audio"
- **THEN** aplikacja MUSI otworzyć modal `AudioEditingMenu` z dwiema sekcjami: "Edycja lektora" i "Edycja wstawki"

### Requirement: Menu Audio prezentuje sekcję edycji lektora

Modal `AudioEditingMenu` SHALL zawierać sekcję "Edycja lektora" z listą głosów pobraną przez `GET /voices?language=<projectLanguage>`. Lista MUST używać tego samego komponentu `PickerCard` co `voice.tsx` i pokazywać aktualnie wybrany głos projektu (`project.voiceId`) jako zaznaczony.

#### Scenario: Lista głosów jest filtrowana językiem projektu

- **WHEN** modal jest otwierany dla projektu o `language="pl"`
- **THEN** aplikacja MUSI wywołać `api.getVoices('pl')` i wyrenderować zwrócone głosy jako `PickerCard`

#### Scenario: Aktualnie wybrany głos jest zaznaczony

- **WHEN** modal otwiera się, a projekt ma ustawione `voiceId`
- **THEN** odpowiadająca karta głosu MUSI mieć stan `selected={true}`

#### Scenario: Brak głosów dla języka

- **WHEN** `api.getVoices(language)` zwraca pustą tablicę
- **THEN** sekcja "Edycja lektora" MUSI wyświetlić komunikat informacyjny zamiast pustej listy

### Requirement: Menu Audio prezentuje sekcję edycji wstawki

Modal `AudioEditingMenu` SHALL zawierać sekcję "Edycja wstawki" z listą presetów pobraną przez `GET /interstitial-presets`. Lista MUST zawierać dodatkową pozycję "Brak wstawki" (`value = null`) i pokazywać aktualnie wybraną wstawkę projektu (`project.interstitialPreset`).

#### Scenario: Lista wstawek zawiera opcję "Brak"

- **WHEN** modal jest otwierany
- **THEN** sekcja "Edycja wstawki" MUSI zawierać pozycję "Brak wstawki" odpowiadającą `interstitialPreset=null`

#### Scenario: Aktualnie wybrana wstawka jest zaznaczona

- **WHEN** modal otwiera się, a projekt ma ustawione `interstitialPreset`
- **THEN** odpowiadająca karta MUSI mieć stan `selected={true}`

### Requirement: Wybór w menu jest transakcyjny

Modal `AudioEditingMenu` SHALL przechowywać lokalny wybór głosu i wstawki dopóki użytkownik nie kliknie "Zapisz". Tap na kartę w sekcji NIE MOŻE wywoływać `api.updateProject` ani modyfikować stanu projektu. "Anuluj" MUST zamknąć modal bez zapisu; "Zapisz" MUST wywołać callback `onSave({ voiceId?, interstitialPreset? })` zawierający tylko zmienione pola.

#### Scenario: Tap na głos zmienia stan lokalny

- **WHEN** użytkownik tapnie inną kartę głosu w modalu
- **THEN** aplikacja MUSI zaktualizować lokalny stan wyboru, ale NIE MOŻE wywołać `PUT /projects/:id`

#### Scenario: Anuluj zamyka modal bez zapisu

- **WHEN** użytkownik tapnie "Anuluj" po zmianie wyboru
- **THEN** modal MUSI się zamknąć, a `project.voiceId`/`project.interstitialPreset` NIE MOŻE się zmienić

#### Scenario: Zapis wywołuje callback z deltą

- **WHEN** użytkownik zmienił głos, NIE zmienił wstawki, i tapnie "Zapisz"
- **THEN** aplikacja MUSI wywołać `onSave({ voiceId: <new> })` (bez pola `interstitialPreset`)

#### Scenario: Zapis wywołuje callback z obiema zmianami

- **WHEN** użytkownik zmienił głos i wstawkę, i tapnie "Zapisz"
- **THEN** aplikacja MUSI wywołać `onSave({ voiceId: <new>, interstitialPreset: <new|null> })`

### Requirement: Zapis lektora aktywuje submit z pełnym przetwarzaniem audio

Po zapisaniu nowego `voiceId` w `AudioEditingMenu` aplikacja SHALL wywołać `api.updateProject(id, { voiceId })`, odświeżyć stan projektu/scen/zdjęć przez `loadAll` oraz aktywować przycisk "Wyślij i przetwórz" w footerze. Tap "Wyślij i przetwórz" MUST uruchomić standardowy submit pipeline, który po wykryciu scen `ready_for_audio` (rezultat serwerowej inwalidacji audio) wywoła `generateAudio` dla wszystkich gotowych scen.

#### Scenario: Po zapisie lektora footer staje się aktywny

- **WHEN** użytkownik zapisuje nowy głos w modalu
- **THEN** aplikacja MUSI wywołać `api.updateProject(id, { voiceId })` i odświeżyć dane
- **AND** przycisk footera "Wyślij i przetwórz" MUSI mieć `disabled=false`

#### Scenario: Tap submit po zmianie lektora generuje audio dla wszystkich scen

- **WHEN** po zmianie lektora wszystkie sceny projektu mają status `ready_for_audio` i użytkownik tapnie "Wyślij i przetwórz"
- **THEN** aplikacja MUSI wywołać `api.generateAudio(id)` i nie wywoływać `processOcrBatch` (sceny mają już `ocr_done`)
- **AND** aplikacja MUSI pokazać fazę `tts` w overlay submita

### Requirement: Zapis wstawki aktywuje submit w trybie tylko-playlist

Po zapisaniu nowego `interstitialPreset` w `AudioEditingMenu` aplikacja SHALL wywołać `api.updateProject(id, { interstitialPreset })`, ustawić wewnętrzną flagę `interstitialDirty=true` oraz aktywować przycisk "Wyślij i przetwórz". Tap "Wyślij i przetwórz" w tym trybie MUST wywołać wyłącznie `api.buildPlaylist(id)`, nie uruchamiać `processOcrBatch` ani `generateAudio`, a po sukcesie wyczyścić `interstitialDirty`.

#### Scenario: Po zapisie wstawki footer staje się aktywny

- **WHEN** użytkownik zmienia wyłącznie wstawkę i zapisuje
- **THEN** aplikacja MUSI wywołać `api.updateProject(id, { interstitialPreset })`
- **AND** przycisk footera "Wyślij i przetwórz" MUSI mieć `disabled=false`
- **AND** flaga `interstitialDirty` MUSI być ustawiona na `true`

#### Scenario: Tap submit po zmianie wstawki przebudowuje tylko playlistę

- **WHEN** `interstitialDirty=true`, projekt ma niepuste `audioTracks`, brak `hasProcessableWork` i `orderDirty=false`, użytkownik tapnie "Wyślij i przetwórz"
- **THEN** aplikacja MUSI wywołać wyłącznie `api.buildPlaylist(id)`
- **AND** NIE MOŻE wywołać `api.processOcrBatch(id)` ani `api.generateAudio(id)`
- **AND** po sukcesie `interstitialDirty` MUSI zostać wyczyszczone

#### Scenario: Footer pozostaje aktywny po połączonej zmianie

- **WHEN** użytkownik zmienił głos i wstawkę w tej samej sesji edycji
- **THEN** standardowy submit pipeline (`generateAudio` + `buildPlaylist`) pokrywa oba przypadki i aplikacja NIE MOŻE wymagać dodatkowego osobnego ruchu

### Requirement: Karty zdjęć odzwierciedlają reset audio po zmianie lektora

Po zapisaniu nowego `voiceId` i odświeżeniu danych każda karta `PageImageCard` SHALL prezentować proces audio jako "niewykonany". Wskaźnik audio (`hasAudio`) MUST być `false` dla wszystkich kart aż do zakończenia ponownej generacji.

#### Scenario: Karty pokazują brak audio po zmianie głosu

- **WHEN** użytkownik zapisał nowy głos i `loadAll` zakończyło się
- **THEN** każda widoczna karta `PageImageCard` MUSI być renderowana z `hasAudio={false}`

#### Scenario: Karty pokazują brak audio nawet jeśli wcześniej audio było wygenerowane

- **WHEN** projekt miał wszystkie sceny `audio_done` przed zmianą głosu
- **THEN** po zapisie nowego głosu i odświeżeniu `getAudioTracks` MUSI zwrócić pustą tablicę (lub tablicę bez powiązań z aktualnymi scenami) i karty NIE MOGĄ pokazywać aktywnego wskaźnika audio
