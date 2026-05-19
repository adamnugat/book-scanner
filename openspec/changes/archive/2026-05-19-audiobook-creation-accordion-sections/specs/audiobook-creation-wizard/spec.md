## MODIFIED Requirements

### Requirement: AudioFlow styling for project setup step

The audiobook creation wizard SHALL render the project setup step using the AudioFlow mobile design system while presenting local bundled jingle presets as selectable options, and without fetching interstitial presets from the backend API. Sekcje Język, Lektor i Wstawka muzyczna SHALL być wyświetlane jako accordiony zgodne z komponentem `SectionAccordion`.

#### Scenario: User opens project setup step

- **WHEN** the user navigates to `projects/new/index`
- **THEN** the screen presents the AudioFlow burgundy ambient background, glass surfaces, glow headline treatment, and pearl-accented primary action based on `design-system/reference-views/New Project.html`

#### Scenario: User configures project basics

- **WHEN** the user enters a title and selects language, voice, and jingle preset
- **THEN** the jingle picker SHALL display options from `LOCAL_JINGLES` with `local:page-turn-3` (Wstawka głosowa) as the first and default selected option
- **AND** each option SHALL display its `icon` emoji alongside the label — `🔔` for page-turn-1 and page-turn-2, `🎙️` for page-turn-3
- **AND** the screen SHALL preserve the existing validation, voice API loading states, selected values, and project creation request behavior

#### Scenario: Icon differentiates jingle types

- **WHEN** the user views the jingle picker
- **THEN** `local:page-turn-1` and `local:page-turn-2` SHALL display a sound icon (`🔔`) and `local:page-turn-3` SHALL display a voice/microphone icon (`🎙️`)

#### Scenario: Jingle preset sent to backend

- **WHEN** the user submits the project creation form with a local jingle selected
- **THEN** the `interstitialPreset` field in the create-project request SHALL be the `name` value from `LOCAL_JINGLES` (e.g. `'local:page-turn-3'` for Wstawka głosowa)

#### Scenario: Options fail to load

- **WHEN** voice loading fails (note: jingle options are local and cannot fail to load)
- **THEN** the screen SHALL preserve the existing error feedback behavior while presenting the error state within the AudioFlow visual language

#### Scenario: Language section displayed as accordion

- **WHEN** the user is on the project setup step
- **THEN** sekcja „Język" SHALL być wyświetlana jako `SectionAccordion` z domyślnie wybraną pierwszą opcją (Polski)
- **AND** wybór języka (pill buttons wewnątrz `GlassPanel`) SHALL zostać zastąpiony listą `PickerCard` wewnątrz accordionu

#### Scenario: Voice section displayed as accordion

- **WHEN** głosy lektora zostaną załadowane
- **THEN** sekcja „Lektor" SHALL być wyświetlana jako `SectionAccordion` z domyślnie wybraną pierwszą opcją z API
- **AND** collapsed state SHALL pokazywać nazwę aktualnie wybranego głosu jako `selectedSummary`

#### Scenario: Jingle section displayed as accordion

- **WHEN** the user views the project setup step
- **THEN** sekcja „Wstawka muzyczna" SHALL być wyświetlana jako `SectionAccordion` z „Wstawką głosową" jako domyślnie wybraną opcją
- **AND** collapsed state SHALL pokazywać label aktualnie wybranego jingle jako `selectedSummary`

#### Scenario: Default selections on first render

- **WHEN** ekran `projects/new/index` renderuje się po raz pierwszy
- **THEN** wszystkie trzy sekcje SHALL być zwinięte
- **AND** Język SHALL mieć wybrany „Polski", Lektor SHALL mieć wybrany pierwszy głos z API, Wstawka muzyczna SHALL mieć wybraną „Wstawkę głosową"
