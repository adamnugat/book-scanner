## Why

Obecny ekran zaznaczania regionów OCR wymaga ręcznego wpisywania współrzędnych i rozmiarów, co jest nieintuicyjne na telefonie i utrudnia przygotowanie zdjęć do rozpoznawania tekstu. Użytkownik powinien móc otworzyć podgląd strony i palcem wskazać jeden lub wiele obszarów w kolejności, w jakiej OCR ma je odczytywać.

## What Changes

- Ekran regionów tekstu w aplikacji mobilnej zostanie zmieniony z formularza współrzędnych na interaktywny podgląd zdjęcia.
- Użytkownik będzie mógł zaznaczać prostokątne regiony palcem lub kursorem bez ręcznego wpisywania `x`, `y`, `width` i `height`.
- Zaznaczone regiony będą widoczne jako ponumerowane nakładki, a numeracja będzie wyznaczać kolejność przekazywania regionów do OCR.
- Użytkownik będzie mógł dodać kilka regionów dla jednej strony, usunąć błędne zaznaczenia i zapisać wynik przed przejściem do scen.
- Jeśli użytkownik nie zapisze żadnych regionów, OCR pozostanie w trybie skanowania całych zdjęć.

## Capabilities

### New Capabilities

- `touch-ocr-region-selection`: Interaktywne definiowanie ponumerowanych regionów OCR na podglądzie zdjęcia strony.

### Modified Capabilities

- Brak.

## Impact

- Affected workspaces: `apps/mobile` for the region selection UI, `apps/api` for region persistence validation/order handling if needed, and `packages/shared` for request/response contracts if region ordering must be explicit in shared types.
- Affected API surface: existing `POST /projects/:projectId/scenes/text-regions` should remain the primary save endpoint; any contract change should preserve the existing error response shape.
- Data model: `TextRegion` may need an explicit order field if creation order is not sufficient for stable OCR ordering.
- OCR flow: region order must be preserved when `process-ocr` passes regions to `recognizeText`; OCR provider selection and Google Cloud Vision integration are non-goals.
- Non-goals: no changes to billing or plan limits, sharing permissions, authentication, storage providers, image upload/thumbnail generation, TTS providers, or OCR provider credentials.
- Expected verification: mobile tests for region drawing/state behavior, API tests for region persistence/order if backend changes are required, plus focused lint/build checks for touched workspaces.
