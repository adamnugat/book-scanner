## Why

Trzy widoki narzędzi projektu — zdjęcia stron (`images.tsx`), głos i audio (`voice.tsx`) oraz udostępnij (`sharing.tsx`) — używają przestarzałego stylu niespójnego z obecnym systemem designu AudioFlow. Użytkownik po wejściu w te widoki widzi stary UI, co psuje spójność aplikacji, która w pozostałych ekranach (dashboard, szczegóły projektu, overlay postępu) jest już w pełni przeniesiona na nowy design.

## What Changes

- `apps/mobile/app/(app)/projects/[id]/images.tsx` — przebudowanie układu i stylów na AudioFlow: glassmorfizm, tokeny kolorów, typografia Quicksand/Varela Round, `AudioFlowScreen` jako wrapper
- `apps/mobile/app/(app)/projects/[id]/voice.tsx` — przebudowanie widoku wyboru głosu i ustawień TTS na AudioFlow: `PickerCard`, `GhostButton`, `PearlButton`, `GlassPanel`
- `apps/mobile/app/(app)/projects/[id]/sharing.tsx` — przebudowanie widoku udostępniania (linki, QR kod, zarządzanie dostępem) na AudioFlow
- Wszystkie trzy widoki otrzymają `TopAppBar` z przyciskiem powrotu i `AudioFlowScreen` jako tło

Nie są to zmiany funkcjonalne — zachowanie, logika i integracje API pozostają niezmienione.

## Capabilities

### New Capabilities

- `page-images-screen-ui`: Widok galerii zdjęć stron w nowym stylu AudioFlow — upload, miniaturki, reorder, status OCR
- `voice-audio-screen-ui`: Widok wyboru głosu i ustawień TTS w nowym stylu AudioFlow — lista profili głosowych, ustawienia generowania
- `share-project-screen-ui`: Widok udostępniania projektu w nowym stylu AudioFlow — linki, kody QR, zarządzanie dostępem

### Modified Capabilities

*(brak zmian w wymaganiach istniejących specs)*

## Impact

- Dotknięte pliki: `apps/mobile/app/(app)/projects/[id]/images.tsx`, `voice.tsx`, `sharing.tsx`
- Workspace: `apps/mobile` wyłącznie
- Brak zmian w API, schemacie Prisma, typach w `packages/shared`
- Brak zmian w logice OCR, TTS, storage
- Weryfikacja: wizualna inspekcja na iOS/Android simulator + `npm run lint`
