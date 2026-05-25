## Why

Obecnie istnieją dwa różne widoki do zaznaczania regionów OCR — jeden w kreatorze nowych audiobooków (`/projects/new/images` → modal w `images.tsx`), drugi w widoku „Zdjęcia stron" istniejącego projektu (`/projects/[id]/images` → przejście na ekran `text-regions.tsx`). Wyglądają i zachowują się różnie, mimo że robią tę samą rzecz. Dodatkowo z poziomu „Zdjęć stron" anulowanie edycji regionów nie wraca do listy zdjęć, tylko zostawia użytkownika na starym ekranie zbiorczym „Regiony tekstu" — który nie pasuje już do nowego przepływu.

## What Changes

- Wprowadzić jeden komponent edytora regionów OCR (`OcrRegionEditor`) zgodny z design systemem (`audioflow-tokens`, `AudioFlowScreen`, `AudioFlowFooterMenu`, `GlassPanel`, `PageImageCard`).
- Wpiąć ten sam komponent w obu przepływach: kreator nowych audiobooków oraz widok „Zdjęcia stron" istniejącego projektu.
- Z widoku „Zdjęcia stron" przejście do edycji regionów dla pojedynczego zdjęcia ma otwierać ten sam edytor (per-strona), bez pośredniego ekranu zbiorczego.
- Anulowanie edycji regionów MUSI wracać do ekranu, z którego użytkownik wszedł (kreator → kreator, zdjęcia stron → zdjęcia stron).
- **BREAKING (UI route)**: Usunąć stary ekran zbiorczy `projects/[id]/text-regions.tsx` („Zaznacz regiony tekstu" / „Regiony tekstu") i jego wpis trasy w `app/(app)/_layout.tsx`. Nawigacja po zapisie regionów z istniejącego projektu wraca do widoku „Zdjęcia stron".
- Ujednolicić nagłówki, typografię, kolory, akcje i dolny pasek edytora zgodnie z design systemem AudioFlow.

Non-goals:
- Bez zmian w geometrii regionów (`text-region-geometry.ts`), w kontraktach `TextRegionInput` / `TextRegionResponse` ani w endpointach API (`/projects/:id/text-regions`).
- Bez zmian w OCR providerach, storage, auth, sharingu ani billingu.
- Bez zmian w przepływie automatycznym kreatora (tryb `auto`) — dotyczy tylko ścieżki ręcznej edycji regionów.

## Capabilities

### New Capabilities
- `unified-ocr-region-editor`: jeden komponent ekranu/edytora do zaznaczania regionów OCR dla pojedynczego zdjęcia strony, używany zarówno przez kreator, jak i widok „Zdjęcia stron", zgodny z design systemem AudioFlow; obsługuje rysowanie, listowanie, usuwanie, zapis i anulowanie regionów oraz powrót do ekranu źródłowego.

### Modified Capabilities
- `touch-ocr-region-selection`: doprecyzowanie, że edytor jest spójny wizualnie i behawioralnie pomiędzy kreatorem i edycją projektu oraz że anulowanie wraca do ekranu wywołującego.
- `page-images-screen-ui`: zmiana celu nawigacji dla akcji „Edytuj regiony" — otwiera ujednolicony edytor regionów dla wybranego zdjęcia, a po anulowaniu/zapisie wraca do listy zdjęć.
- `audiobook-creation-wizard`: edycja regionów w kreatorze (tryb zaawansowany) używa tego samego ujednoliconego edytora.

## Impact

- Workspaces: `apps/mobile` (UI), brak zmian w `apps/api`, brak zmian w `packages/shared`.
- Kod:
  - Nowy: `apps/mobile/components/audioflow/OcrRegionEditor.tsx` (lub `apps/mobile/components/OcrRegionEditor.tsx`).
  - Modyfikacja: `apps/mobile/app/(app)/projects/new/images.tsx` (zastąpienie wbudowanego modala), `apps/mobile/app/(app)/projects/[id]/images.tsx` (zmiana celu `openRegionEditor`), `apps/mobile/app/(app)/_layout.tsx` (usunięcie wpisu trasy `projects/[id]/text-regions`).
  - Nowa trasa (lub modal): `apps/mobile/app/(app)/projects/[id]/text-regions/[pageImageId].tsx` ALBO presentation jako modal z `[id]/images.tsx` — wybór w design.md.
  - Usuwane: `apps/mobile/app/(app)/projects/[id]/text-regions.tsx`.
- Bez zmian w API, bazie, providerach, kontraktach typów.
- Wymagana weryfikacja: `npm run test:mobile`, `npm run lint`, `npm run format:check`. Manualne sprawdzenie obu ścieżek (kreator + zdjęcia stron) na web/iOS/Android.
