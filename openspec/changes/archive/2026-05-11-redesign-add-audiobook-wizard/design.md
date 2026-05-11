## Context

Obecny proces tworzenia audiobooka jest rozproszony na wiele ekranów i wymaga od użytkownika ręcznego wyzwalania kolejnych etapów (OCR, TTS). Dodatkowo, przesyłanie zdjęć w pełnej rozdzielczości z nowoczesnych smartfonów generuje ogromny ruch sieciowy i może powodować błędy w Google Cloud Vision API ze względu na limity wielkości zapytań (max 16 zdjęć, max 10MB payloadu).

## Architecture

Proces tworzenia audiobooka zostanie przebudowany na 3-etapowy kreator (Wizard).

### 1. Frontend: Wizard (Kreator)
Struktura plików w `apps/mobile/app/(app)/projects/new/`:
- `index.tsx` (Krok 1): Formularz pobierający Tytuł, Język, Głos lektora oraz Wstawkę (interstitial preset). Zakończenie tego kroku tworzy projekt w bazie (`POST /projects`) i przechodzi do kroku 2.
- `images.tsx` (Krok 2): Ekran dodawania zdjęć (aparat/galeria). Po dodaniu zdjęć użytkownik wybiera tryb:
  - **Tryb Automatyczny**: Wywołuje upload zdjęć, następnie nowy endpoint `POST /projects/:id/process-ocr-batch`, a po nim `POST /projects/:id/generate-audio`. Na koniec przekierowuje do odtwarzacza.
  - **Tryb Zaawansowany**: Wyświetla listę dodanych zdjęć (wykorzystując obecną logikę z `projects/[id]/images.tsx` - zmiana kolejności, usuwanie, kadrowanie). Po zatwierdzeniu wywołuje upload, `process-ocr-batch` i przekierowuje do Kroku 3.
- `review.tsx` (Krok 3 - tylko Zaawansowany): Ekran podglądu i edycji transkrypcji (bazujący na obecnym `text-regions.tsx` / `voice.tsx`). Po zatwierdzeniu wywołuje `generate-audio` i przekierowuje do odtwarzacza.

### 2. Frontend: Optymalizacja Uploadu Zdjęć
W pliku `apps/mobile/lib/image-upload.ts`:
- Zmodyfikujemy funkcję `uploadFileFromImagePickerAsset`, aby używała `expo-image-manipulator` dla **każdego** dodawanego zdjęcia (nie tylko HEIC).
- Parametry kompresji: `resize: { width: 1600 }` (wysokość dopasuje się proporcjonalnie), `format: SaveFormat.JPEG`, `compress: 0.95` (lub 1.0, aby zachować ostrość tekstu dla OCR).

### 3. Backend: Smart Batching OCR
W pliku `apps/api/src/routes/ocr.ts`:
- Dodamy nowy endpoint `POST /projects/:id/process-ocr-batch`.
- Endpoint pobierze wszystkie zdjęcia projektu (lub listę przekazanych ID), które nie mają jeszcze przetworzonego tekstu.
- Logika podzieli zdjęcia na "paczki" (chunks) po maksymalnie **5 zdjęć** każda.
- Dodatkowo backend będzie pilnował bezpiecznego rozmiaru payloadu na podstawie faktycznej liczby bajtów pobranych plików (z marginesem poniżej limitu 10MB), więc bardzo duże zdjęcie może wymusić mniejszą paczkę.
- Paczki będą wysyłane do Google Vision API sekwencyjnie w zachowanej kolejności, aby nie przekroczyć limitu 16 zdjęć i 10MB payloadu na jedno zapytanie.
- Wyniki zostaną połączone i zapisane w bazie danych.
- Dla trybu automatycznego frontend przekaże flagę `markReadyForAudio`, dzięki której backend po OCR ustawi sceny jako `ready_for_audio`. Dla trybu zaawansowanego sceny pozostają `ocr_done`, aby użytkownik mógł je skorygować w kroku 3.

## Data Model

Brak zmian w schemacie bazy danych. Wykorzystujemy istniejące modele `Project`, `PageImage`, `TextRegion` oraz `AudioTrack`.

## Risks & Mitigations

- **Ryzyko:** Utrata ostrości tekstu przy kompresji na frontendzie.
  - **Mitygacja:** Ustawienie szerokości na 1600px (zgodnie z rekomendacjami Google Vision dla `DOCUMENT_TEXT_DETECTION`) oraz wysokiej jakości kompresji JPEG (95-100%).
- **Ryzyko:** Przekroczenie limitów Google Vision API mimo batchingu.
  - **Mitygacja:** Ustalenie rozmiaru paczki na bezpieczne 5 zdjęć oraz dodatkowy limit bajtów paczki po stronie backendu. Jeśli skompresowane zdjęcie nadal będzie duże, backend automatycznie utworzy mniejszą paczkę.
