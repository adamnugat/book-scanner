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

The audiobook creation wizard SHALL render the project setup step using the AudioFlow mobile design system while preserving the existing project creation behavior.

#### Scenario: User opens project setup step

- **WHEN** the user navigates to `projects/new/index`
- **THEN** the screen presents the AudioFlow burgundy ambient background, glass surfaces, glow headline treatment, and pearl-accented primary action based on `design-system/reference-views/New Project.html`

#### Scenario: User configures project basics

- **WHEN** the user enters a title and selects language, voice, and interstitial preset
- **THEN** the screen SHALL preserve the existing validation, API loading states, selected values, and project creation request behavior

#### Scenario: Options fail to load

- **WHEN** voice or interstitial preset loading fails
- **THEN** the screen SHALL preserve the existing error feedback behavior while presenting the error state within the AudioFlow visual language

### Requirement: AudioFlow styling for photo step

The audiobook creation wizard SHALL render the photo step using the AudioFlow mobile design system while preserving the existing image selection and processing behavior.

#### Scenario: User opens photo step

- **WHEN** the user navigates to `projects/new/images`
- **THEN** the screen presents the AudioFlow top app bar, title block, photo source actions, mode cards, and pearl-accented continue action based on `design-system/reference-views/Add Photos.html`

#### Scenario: User adds photos

- **WHEN** the user adds photos from the gallery or camera
- **THEN** the screen SHALL preserve the existing pending image state, uploaded image state, count display, and preview behavior

#### Scenario: User selects automatic mode

- **WHEN** the user continues in automatic mode
- **THEN** the screen SHALL preserve the existing upload, batch OCR, audio generation, audio polling, and player navigation behavior

#### Scenario: User selects advanced mode

- **WHEN** the user continues in advanced mode
- **THEN** the screen SHALL preserve the existing upload, batch OCR, review-step navigation, pending image reorder, pending image removal, and region-edit affordances

### Requirement: Wizard accessibility and testability

The redesigned wizard screens SHALL keep core actions accessible and testable after the visual refactor.

#### Scenario: Primary actions are disabled

- **WHEN** required wizard input is missing or processing is active
- **THEN** the corresponding primary action SHALL expose a disabled state visually and functionally

#### Scenario: Automated tests query actions

- **WHEN** mobile tests render the redesigned wizard screens
- **THEN** core actions for creating the project, adding photos, selecting mode, and continuing the flow remain discoverable by text, role, or accessibility label
