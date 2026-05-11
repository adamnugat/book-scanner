# Tasks

## Phase 1: Backend - OCR Batching Endpoint
- [x] 1.1 W `apps/api/src/routes/ocr.ts` dodaj endpoint `POST /projects/:id/process-ocr-batch`.
- [x] 1.2 W `apps/api/src/lib/ocr.ts` zaimplementuj logikę dzielenia obrazków na paczki (chunks) po 5 sztuk.
- [x] 1.3 Zaktualizuj logikę wywoływania `recognizeText`, aby obsługiwała paczki i poprawnie zapisywała wyniki w bazie.
- [x] 1.4 Dodaj testy jednostkowe dla nowego endpointu i logiki batchingu.

## Phase 2: Frontend - Image Optimization
- [x] 2.1 W `apps/mobile/lib/image-upload.ts` zmodyfikuj `uploadFileFromImagePickerAsset`.
- [x] 2.2 Wymuś użycie `manipulateAsync` dla każdego obrazka, ustawiając `resize: { width: 1600 }`, `format: SaveFormat.JPEG` i `compress: 0.95`.
- [x] 2.3 Przetestuj upload różnych formatów i rozmiarów zdjęć, sprawdzając wagę plików wysyłanych w żądaniach sieciowych.

## Phase 3: Frontend - Wizard UI
- [x] 3.1 Przebuduj `apps/mobile/app/(app)/projects/new.tsx` na `apps/mobile/app/(app)/projects/new/index.tsx` (Krok 1).
- [x] 3.2 Dodaj pobieranie głosów i wstawek (interstitial presets) z API w Kroku 1.
- [x] 3.3 Dodaj wybór wstawki do formularza tworzenia projektu.
- [x] 3.4 Utwórz `apps/mobile/app/(app)/projects/new/images.tsx` (Krok 2), przenosząc logikę z obecnego `projects/[id]/images.tsx`.
- [x] 3.5 W Kroku 2 dodaj przełącznik trybu (Automatyczny / Zaawansowany).
- [x] 3.6 Utwórz `apps/mobile/app/(app)/projects/new/review.tsx` (Krok 3) dla trybu zaawansowanego (podgląd i edycja transkrypcji).

## Phase 4: Frontend - Wizard Logic
- [x] 4.1 Zaimplementuj przepływ trybu Automatycznego: Upload -> `process-ocr-batch` -> `generate-audio` -> Przekierowanie do odtwarzacza.
- [x] 4.2 Zaimplementuj przepływ trybu Zaawansowanego: Upload -> `process-ocr-batch` -> Przekierowanie do Kroku 3.
- [x] 4.3 W Kroku 3 zaimplementuj logikę zapisywania edytowanego tekstu -> `generate-audio` -> Przekierowanie do odtwarzacza.
- [x] 4.4 Dodaj ekrany ładowania/postępu podczas długotrwałych operacji (OCR, TTS).

## Phase 5: Cleanup & Integration
- [x] 5.1 Upewnij się, że nowy proces tworzenia współpracuje z niedawno przeprojektowanym ekranem szczegółów projektu (`projects/[id]/index.tsx`).
- [x] 5.2 Usuń lub ukryj stare, nieużywane już przyciski i ekrany zarządzania OCR/TTS, jeśli nie są już potrzebne poza kreatorem.
- [x] 5.3 Przetestuj cały proces end-to-end dla obu trybów.
