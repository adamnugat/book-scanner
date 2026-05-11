## Why

Obecny proces dodawania nowego audiobooka przypomina zarządzanie zasobami IT, a nie prosty kreator. Użytkownik musi ręcznie tworzyć projekt, wchodzić w zdjęcia, robić je, wyzwalać OCR, wybierać głos i wyzwalać TTS. Dodatkowo, wysyłanie zdjęć wysokiej rozdzielczości (np. z nowoczesnych smartfonów) powoduje ogromne zużycie transferu i naraża nas na błędy związane z limitami Google Cloud Vision API (max 16 zdjęć na zapytanie i ok. 10MB payloadu).

Chcemy przekształcić ten proces w płynny kreator (Wizard), który:
1. Prowadzi użytkownika za rękę (Tytuł/Głos -> Zdjęcia -> Gotowe).
2. Oferuje Tryb Automatyczny (jedno kliknięcie do audiobooka) oraz Tryb Zaawansowany (korekta OCR, edycja obszarów).
3. Optymalizuje zużycie sieci i koszty poprzez kompresję zdjęć na frontendzie i "Smart Batching" OCR na backendzie, z uwzględnieniem limitów Google.

## What Changes

1. **Nowy UI Kreatora (Frontend)**:
   - `WizardStep1`: Pobranie tytułu, języka, wybór głosu lektora oraz **wybór wstawki audio (interstitial preset)**, która będzie odtwarzana między stronami.
   - `WizardStep2`: Dodawanie zdjęć (aparat/galeria) oraz wybór trybu:
     - **Automatyczny**: Po zatwierdzeniu aplikacja w tle robi OCR i TTS, a użytkownik trafia do odtwarzacza.
     - **Zaawansowany**: Użytkownik widzi obecny ekran zarządzania zdjęciami (zmiana kolejności, usuwanie, kadrowanie). Po zatwierdzeniu następuje OCR, a potem krok 3 (Korekta tekstu).
   - `WizardStep3` (tylko Zaawansowany): Podgląd zdjęć i edycja transkrypcji. Po zatwierdzeniu następuje TTS.

2. **Optymalizacja Uploadu Zdjęć (Frontend)**:
   - W `image-upload.ts` dodajemy obowiązkową kompresję i zmianę rozmiaru (downsizing) dla *każdego* zdjęcia przed wysłaniem na serwer.
   - Zdjęcia będą skalowane do optymalnej dla OCR szerokości (np. 1600px).
   - **Jakość kompresji JPEG zostanie ustawiona na wysoką (np. 95% - 100%)**, aby uniknąć artefaktów kompresji na krawędziach liter, co mogłoby negatywnie wpłynąć na dokładność OCR, przy jednoczesnym zachowaniu bezpiecznego rozmiaru pliku (znacznie poniżej 6MB).

3. **Smart Batching OCR (Backend)**:
   - Nowy endpoint `POST /projects/:id/process-ocr-batch`, który przyjmuje listę ID obrazków (lub przetwarza wszystkie nieprzetworzone w projekcie).
   - Logika dzieli zdjęcia na bezpieczne paczki (np. po 5-8 zdjęć) przed wysłaniem do Google Vision API, aby nie przekroczyć limitu 16 zdjęć i 10MB payloadu na zapytanie.
   - Backend zbiera wyniki z równoległych zapytań i zapisuje je do bazy.

## Capabilities

### New Capabilities
- `audiobook-creation-wizard`: Liniowy proces tworzenia audiobooka z podziałem na tryb automatyczny i zaawansowany.
- `smart-batch-ocr`: Zoptymalizowane, grupowe przetwarzanie obrazów przez Google Vision API z omijaniem limitów.
- `frontend-image-compression`: Automatyczne zmniejszanie rozdzielczości i kompresja zdjęć przed uploadem.

### Modified Capabilities
- Zmiana przeznaczenia strony szczegółów projektu (`projects/[id]/index.tsx`), która teraz będzie głównie odtwarzaczem, ponieważ zarządzanie przenosi się do kreatora.

## Impact

- **Frontend**: Nowe ekrany w `apps/mobile/app/(app)/projects/new/`. Modyfikacja `image-upload.ts`.
- **Backend**: Nowy endpoint i logika w `apps/api/src/routes/ocr.ts` oraz `apps/api/src/lib/ocr.ts`.
- **Baza Danych**: Brak zmian w schemacie.
- **Koszty/Sieć**: Drastyczny spadek zużycia transferu danych przez użytkowników oraz zoptymalizowane zapytania do Google Vision API.
