## ADDED Requirements

### Requirement: SectionAccordion component in AudioFlow design system

Komponent `SectionAccordion` SHALL być dodany do `apps/mobile/components/audioflow.tsx` i eksportowany jako element design systemu.

#### Scenario: Accordion renders in collapsed state

- **WHEN** `isExpanded` prop jest `false`
- **THEN** komponent SHALL wyświetlać tylko nagłówek sekcji, podsumowanie wybranej wartości (`selectedSummary`) oraz przycisk z ikoną ołówka po prawej stronie
- **AND** lista opcji (`children`) SHALL być ukryta

#### Scenario: Accordion expands on edit button press

- **WHEN** użytkownik naciśnie przycisk ołówka
- **THEN** komponent SHALL wywołać prop `onEditPress`
- **AND** ekran nadrzędny zaktualizuje stan, powodując wyświetlenie `children` i opisu sekcji (`description`)

#### Scenario: Only one accordion expanded at a time

- **WHEN** użytkownik naciśnie ołówek w sekcji X, gdy sekcja Y jest aktualnie otwarta
- **THEN** sekcja Y SHALL się zwinąć
- **AND** sekcja X SHALL się rozwinąć

#### Scenario: Edit button toggles same section

- **WHEN** użytkownik naciśnie ołówek w sekcji, która jest już otwarta
- **THEN** sekcja SHALL się zwinąć

### Requirement: Jingle inline audio preview

Kliknięcie na opcję jingle SHALL odtwarzać jej dźwięk w tle bez przejścia do żadnego ekranu odtwarzacza.

#### Scenario: Tapping jingle option plays audio

- **WHEN** użytkownik naciśnie opcję jingle na liście
- **THEN** plik audio przypisany do tej opcji SHALL rozpocząć odtwarzanie
- **AND** żadna nawigacja ani modal nie zostanie uruchomiony
- **AND** wybrany jingle (`selectedPresetName`) SHALL zostać zaktualizowany do wciśniętej opcji

#### Scenario: Playing jingle shows play indicator

- **WHEN** jingle jest aktualnie odtwarzany
- **THEN** po prawej stronie opcji SHALL pojawić się ikona play (▶)
- **AND** żadna inna opcja nie SHALL wyświetlać tej ikony w tym samym czasie

#### Scenario: Tapping playing jingle stops audio

- **WHEN** użytkownik naciśnie opcję, która jest aktualnie odtwarzana
- **THEN** odtwarzanie SHALL zostać zatrzymane
- **AND** ikona play SHALL zniknąć

#### Scenario: Audio stops when playback completes

- **WHEN** plik audio zakończy odtwarzanie
- **THEN** ikona play SHALL automatycznie zniknąć bez interakcji użytkownika

#### Scenario: Audio unloaded on screen unmount

- **WHEN** ekran `projects/new/index` zostaje odmontowany podczas odtwarzania
- **THEN** aktywny `Audio.Sound` SHALL zostać zatrzymany i zwolniony (`unloadAsync`)
