## MODIFIED Requirements

### Requirement: Region editing opens the unified editor and returns to page-images on exit

From the project page-images screen, opening region editing for a page SHALL route the user to the shared `OcrRegionEditor` for that single page. The legacy aggregate "Regiony tekstu" listing screen MUST NOT be reachable from the page-images flow. Cancelling or saving in the editor MUST return the user to the page-images screen.

#### Scenario: User taps "Edytuj regiony" on a page card

- **WHEN** the user taps the region-edit affordance on a page card in the page-images screen
- **THEN** the app MUST present the shared `OcrRegionEditor` scoped to that page image, not an aggregate page list

#### Scenario: User cancels region editing

- **WHEN** the user cancels region editing
- **THEN** the app MUST return to the project page-images screen (the screen that opened the editor) and MUST NOT route to a "Regiony tekstu" listing screen

#### Scenario: User saves region edits

- **WHEN** the user saves region edits
- **THEN** the app MUST persist the regions for that page image and return the user to the project page-images screen
- **AND** the page card region counter MUST reflect the updated number of regions for that page

#### Scenario: Legacy aggregate route is gone

- **WHEN** any code or deep link points at the legacy `projects/[id]/text-regions` aggregate screen
- **THEN** the route MUST NOT be registered in the app navigator and MUST NOT render the legacy "Zaznacz regiony tekstu" listing

## ADDED Requirements

### Requirement: Środkowy przycisk stopki wykonuje pełny submit zamiast cichego zapisu

Środkowy slot `AudioFlowFooterMenu` na ekranie zdjęć projektu (`apps/mobile/app/(app)/projects/[id]/images.tsx`) SHALL przedstawiać akcję pełnego submitu (label „Wyślij i przetwórz", `createIcon='check'`) zamiast dotychczasowego cichego „Zapisz zmiany". Pojedyncze kliknięcie MUST uruchomić sekwencję: upload pendingów → `process-ocr-batch` → nawigacja do widoku głosu. Brak akcji bez widocznego komunikatu.

#### Scenario: Etykieta i ikona przycisku

- **WHEN** ekran zdjęć jest wyrenderowany w trybie „istniejący projekt"
- **THEN** środkowy przycisk stopki MUST mieć etykietę „Wyślij i przetwórz" oraz `createIcon='check'`
- **AND** MUST być wyłączony, gdy nie ma żadnych zmian od ostatniego submitu

#### Scenario: Wcześniejszy przycisk "Zapisz zmiany" nie istnieje

- **WHEN** ekran zdjęć jest wyrenderowany
- **THEN** żaden element UI nie MUST używać etykiety „Zapisz zmiany" jako jedynej akcji submitu
