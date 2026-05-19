# Audiobook Creation Wizard

## Overview

Proces dodawania audiobooka musi być prosty, liniowy i zoptymalizowany pod kątem zużycia danych oraz limitów zewnętrznych API (Google Vision). Użytkownik powinien móc stworzyć audiobooka za pomocą kilku kliknięć (Tryb Automatyczny) lub mieć pełną kontrolę nad procesem (Tryb Zaawansowany).

## Acceptance Criteria

### AC-1: Krok 1 - Podstawy Projektu
- [ ] Ekran `projects/new/index.tsx` zawiera formularz z polami: Tytuł, Język, Głos lektora, Wstawka (interstitial preset).
- [ ] Głosy lektorów i presety wstawek są pobierane z backendu.
- [ ] Po zatwierdzeniu formularza, projekt jest tworzony w bazie danych, a użytkownik przechodzi do Kroku 2.

### AC-2: Krok 2 - Dodawanie Zdjęć i Wybór Trybu
- [ ] Ekran `projects/new/images.tsx` pozwala na dodanie zdjęć z aparatu lub galerii.
- [ ] Po dodaniu zdjęć pojawia się wybór trybu: "Automatyczny" (domyślny) lub "Zaawansowany".
- [ ] W trybie "Automatyczny" wyświetlana jest tylko informacja o liczbie dodanych zdjęć i przycisk "Utwórz audiobooka".
- [ ] W trybie "Zaawansowany" wyświetlana jest lista zdjęć z możliwością zmiany kolejności, usuwania i edycji obszarów (istniejąca logika).

### AC-3: Optymalizacja Uploadu Zdjęć (Frontend)
- [ ] Każde zdjęcie (niezależnie od formatu) przed wysłaniem na serwer jest skalowane do maksymalnej szerokości 1600px.
- [ ] Zdjęcia są kompresowane do formatu JPEG z wysoką jakością (np. 95%), aby zachować ostrość tekstu dla OCR przy jednoczesnym zmniejszeniu wagi pliku.

### AC-4: Smart Batching OCR (Backend)
- [ ] Backend udostępnia endpoint `POST /projects/:id/process-ocr-batch`.
- [ ] Endpoint dzieli zdjęcia na paczki po maksymalnie 5 sztuk.
- [ ] Endpoint dodatkowo pilnuje bezpiecznego rozmiaru payloadu na podstawie faktycznego rozmiaru pobranych plików, aby nie zbliżać się do limitu 10MB na zapytanie.
- [ ] Paczki są wysyłane do Google Vision API równolegle lub sekwencyjnie, nie przekraczając limitów (max 16 zdjęć i 10MB na zapytanie).
- [ ] Wyniki OCR są zapisywane w bazie danych dla odpowiednich stron/obszarów.
- [ ] Dla przepływu automatycznego endpoint umożliwia oznaczenie rozpoznanych scen jako `ready_for_audio`, aby TTS mógł wystartować bez ręcznej korekty.

### AC-5: Przepływ Trybu Automatycznego
- [ ] Po kliknięciu "Utwórz audiobooka" w trybie automatycznym, aplikacja w tle:
  1. Wysyła zoptymalizowane zdjęcia na serwer.
  2. Wywołuje `process-ocr-batch`.
  3. Wywołuje `generate-audio` (TTS).
- [ ] Podczas tego procesu użytkownik widzi ekran ładowania/postępu.
- [ ] Po zakończeniu użytkownik jest przekierowywany bezpośrednio do odtwarzacza (`projects/[id]/player`).

### AC-6: Przepływ Trybu Zaawansowanego
- [ ] Po kliknięciu "Dalej" w trybie zaawansowanym, aplikacja:
  1. Wysyła zdjęcia i wywołuje `process-ocr-batch`.
  2. Przekierowuje użytkownika do Kroku 3 (`projects/new/review.tsx`).
- [ ] Krok 3 pozwala na podgląd każdego zdjęcia i edycję rozpoznanego tekstu.
- [ ] Po zatwierdzeniu Kroku 3, aplikacja wywołuje `generate-audio` i przekierowuje do odtwarzacza.

## Formal requirements — AudioFlow UI (mobile)

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

### Requirement: Wizard accessibility and testability

The redesigned wizard screens SHALL keep core actions accessible and testable after the visual refactor.

#### Scenario: Primary actions are disabled

- **WHEN** required wizard input is missing or processing is active
- **THEN** the corresponding primary action SHALL expose a disabled state visually and functionally

#### Scenario: Automated tests query actions

- **WHEN** mobile tests render the redesigned wizard screens
- **THEN** core actions for creating the project, adding photos, selecting mode, and continuing the flow remain discoverable by text, role, or accessibility label

#### Scenario: Processing overlay is accessible

- **WHEN** the automatic mode processing overlay is visible
- **THEN** each step in the 3-step timeline SHALL have an accessible label indicating its state (completed, active, or pending)
- **AND** the overlay SHALL not block gesture-based navigation that could trigger unintended side effects
