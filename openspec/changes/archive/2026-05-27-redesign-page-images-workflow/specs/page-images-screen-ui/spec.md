## MODIFIED Requirements

### Requirement: Region editing opens the unified editor and returns to page-images on exit

From the project page-images screen, opening region editing for a page SHALL present the shared `OcrRegionEditor` for that single page **inside a modal hosted on the page-images screen**, not by routing to a separate screen. The legacy aggregate "Regiony tekstu" listing screen MUST NOT be reachable. Cancelling or saving in the modal MUST close the modal and keep the user on the page-images screen.

#### Scenario: User taps the region icon on a page card

- **WHEN** the user taps the region-edit affordance on a page card (with the "wybór obszarów" toggle enabled)
- **THEN** the app MUST present the shared `OcrRegionEditor` scoped to that page image inside a modal, not an aggregate page list and not a separate route

#### Scenario: User cancels region editing

- **WHEN** the user cancels region editing in the modal
- **THEN** the app MUST close the modal without saving and keep the user on the page-images screen

#### Scenario: User saves region edits

- **WHEN** the user saves region edits in the modal
- **THEN** the app MUST persist the regions for that page image and close the modal
- **AND** the page card region status icon MUST reflect the updated number of regions for that page

#### Scenario: Legacy aggregate route is gone

- **WHEN** any code or deep link points at the legacy `projects/[id]/text-regions` aggregate screen
- **THEN** the route MUST NOT be registered in the app navigator and MUST NOT render the legacy "Zaznacz regiony tekstu" listing

### Requirement: Środkowy przycisk stopki wykonuje pełny submit zamiast cichego zapisu

Środkowy slot `AudioFlowFooterMenu` na ekranie zdjęć projektu (`apps/mobile/app/(app)/projects/[id]/images.tsx`) SHALL przedstawiać akcję pełnego submitu (label „Wyślij i przetwórz", `createIcon='check'`). Footer MUST dodatkowo udostępniać przycisk galerii (lewy slot) i przycisk aparatu (prawy slot). Pojedyncze kliknięcie submitu MUST uruchomić sekwencję: upload pendingów → OCR dla wszystkich zdjęć → (opcjonalna korekta) → TTS dla wszystkich zdjęć → przejście do widoku szczegółów audiobooka. Brak akcji bez widocznego komunikatu.

#### Scenario: Etykieta i ikona przycisku submitu

- **WHEN** ekran zdjęć jest wyrenderowany w trybie „istniejący projekt"
- **THEN** środkowy przycisk stopki MUST mieć etykietę „Wyślij i przetwórz" oraz `createIcon='check'`
- **AND** MUST być wyłączony, gdy nie ma żadnych zmian od ostatniego submitu

#### Scenario: Footer udostępnia galerię i aparat

- **WHEN** ekran zdjęć jest wyrenderowany
- **THEN** lewy slot footera MUST otwierać galerię, a prawy slot MUST otwierać aparat

#### Scenario: Submit nie nawiguje do Głosu Lektora

- **WHEN** submit zakończy się pomyślnie
- **THEN** aplikacja MUST przejść do widoku szczegółów audiobooka, a NIE do ekranu Głosu Lektora

#### Scenario: Wcześniejszy przycisk "Zapisz zmiany" nie istnieje

- **WHEN** ekran zdjęć jest wyrenderowany
- **THEN** żaden element UI nie MUST używać etykiety „Zapisz zmiany" jako jedynej akcji submitu
