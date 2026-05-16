## 1. Tryb automatyczny — sekwencyjny OCR → TTS

- [x] 1.1 Dodać funkcję `waitForOcrCompletion(projectId)` w `apps/mobile/app/(app)/projects/new/images.tsx` — polluje `api.getScenes` co 1.5s (max 60 prób), kończy gdy żadna scena nie ma statusu `ocr_processing` ani `queued`
- [x] 1.2 Dodać obsługę timeout (po 60 próbach) z wyświetleniem błędu i możliwością ponowienia
- [x] 1.3 Zaktualizować `runAutomaticFlow` — po `processOcrBatch` wywołać `waitForOcrCompletion` przed `generateAudio`
- [x] 1.4 Napisać test jednostkowy dla `waitForOcrCompletion` w `apps/mobile` — scenariusz sukcesu i timeout

## 2. Tryb zaawansowany — UX kart zdjęć (Krok 2)

- [x] 2.1 W `renderAdvancedItem` w `images.tsx` zamienić przycisk tekstowy "Usuń" na `<Ionicons name="trash-outline" />` (lub ikonę z biblioteki używanej w projekcie)
- [x] 2.2 Dodać przycisk/ikonę wyboru obszarów OCR przy każdej karcie zdjęcia w `renderAdvancedItem`
- [x] 2.3 Podpiąć handler przycisku obszarów — otwiera widok `touch-ocr-region-selection` z `pageImageId` wybranego zdjęcia

## 3. Modal / nawigacja wyboru obszarów OCR w kreatorze

- [x] 3.1 Sprawdzić istniejący widok `touch-ocr-region-selection` pod kątem obsługi nawigacji powrotnej do Kroku 2 kreatora
- [x] 3.2 Zaimplementować otwarcie widoku wyboru obszarów z Kroku 2 (modal lub router push) — po zamknięciu powrót do `projects/new/images`
- [x] 3.3 Upewnić się, że `TextRegion` zapisywane przez widok są powiązane z właściwym `pageImageId`

## 4. Weryfikacja przepływu Krok 2→3→odtwarzacz (tryb zaawansowany)

- [x] 4.1 Zweryfikować że `runAdvancedFlow` w `images.tsx` poprawnie nawiguje do `review.tsx` po OCR
- [x] 4.2 Zweryfikować że `review.tsx` poprawnie odbiera `projectId` i wyświetla wyniki OCR w `textarea` per scena
- [x] 4.3 Zweryfikować że submit w `review.tsx` zapisuje edytowane teksty, wywołuje `generateAudio` i nawiguje do odtwarzacza
- [ ] 4.4 Przetestować manualnie pełny przepływ end-to-end: Krok 1 → Krok 2 (zaawansowany) → obszary → submit → Krok 3 → korekta → submit → odtwarzacz

## 5. Weryfikacja i lint

- [x] 5.1 Uruchomić `npm run test:mobile` — wszystkie testy przechodzą (54/54)
  - Dodano `createTestID` prop do `AudioFlowFooterMenu`, przekazano `wizard-continue` z `images.tsx`
  - Naprawiono `runAdvancedFlow` (processOcrBatch przed router.push — brak race condition)
  - Dodano `force: true` w `runAdvancedFlow` + backend reset scen
  - Dodano ładniejszy overlay postępu przetwarzania w `images.tsx`
  - Dodano licznik postępu OCR w `review.tsx`
  - Naprawiono test `new-project-wizard` i `new-project-images-wizard`
- [x] 5.2 Uruchomić `npm run lint` — brak błędów
- [x] 5.3 Uruchomić `npm run format:check` — formatowanie poprawne
