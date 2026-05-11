## Why

Widok szczegółów projektu nadal odstaje od wdrożonego AudioFlow design system: używa starego granatowego tła, lokalnych kart i prostego CTA do odtwarzacza. To jest naturalny kolejny etap po kreatorze, loginie, dashboardzie, headerze i footer menu, bo ekran projektu jest głównym miejscem pracy i odtwarzania audiobooka.

## What Changes

- Przebudować `/(app)/projects/[id]/index` na AudioFlow Project Details zgodnie z `design-system/reference-views/Project Details.html`.
- Zastąpić stary górny cover/prosty przycisk rozbudowanym górnym kontenerem: status projektu, metadane stron, tytuł, głos/wstawka oraz glass player panel z paskiem postępu i kontrolkami transportu.
- Zachować istniejące rozróżnienie stanu projektu z audio i bez audio, ale oba stany pokazać w języku AudioFlow zamiast starego dark-blue UI.
- Odświeżyć siatkę narzędzi projektu jako glass tiles prowadzące do istniejących tras zdjęć, głosu/audio, udostępniania i dostępnych akcji projektu.
- Użyć istniejących prymitywów `apps/mobile/components/audioflow.tsx` i rozszerzyć je tylko o brakujące elementy prezentacyjne potrzebne temu ekranowi, np. player hero, progress bar, tool tile lub status row.
- Zachować obecne pobieranie projektu i audio, menu edycji/usuwania oraz nawigację do istniejącego pełnego odtwarzacza.
- Nie zmieniać API, OCR, TTS, auth, storage, billingów, sharing contracts ani backendowych modeli.

## Capabilities

### New Capabilities

### Modified Capabilities

- `audioflow-mobile-design-system`: rozszerza zestaw prymitywów o elementy potrzebne dla Project Details, zwłaszcza górny kontener z odtwarzaczem i kafelki narzędzi.
- `project-dashboard-ui`: zmienia wymagania widoku szczegółów projektu tak, aby korzystał z AudioFlow Project Details i zachował istniejące zachowanie projektu.

## Impact

- Affected workspace: `apps/mobile`.
- Expected files: `apps/mobile/app/(app)/projects/[id]/index.tsx`, `apps/mobile/components/audioflow.tsx` oraz powiązane testy mobilne.
- Existing APIs remain unchanged: project details, audio tracks, playlist, OCR, TTS, auth, sharing and storage contracts are non-goals.
- Verification scope: mobile Jest tests for project detail behavior and navigation, workspace lint/format where practical, plus manual comparison against `Project Details.html`.
