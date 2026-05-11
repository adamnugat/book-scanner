# Audiobook Creation Wizard

## Overview

Proces dodawania audiobooka musi być prosty, liniowy i zoptymalizowany pod kątem zużycia danych oraz limitów zewnętrznych API (Google Vision). Użytkownik powinien móc stworzyć audiobooka za pomocą kilku kliknięć (Tryb Automatyczny) lub mieć pełną kontrolę nad procesem (Tryb Zaawansowany).

## Acceptance Criteria

### AC-1: Krok 1 - Podstawy Projektu
- [ ] Ekran `projects/new/index.tsx` zawiera formularz z polami: Tytuł, Język, Głos lektora, Wstawka (interstitial preset).
- [ ] Głosy lektorów i presety wstawek są pobierane z backendu.
- [ ] Po zatwierdzeniu formularza, projekt jest tworzony w bazie danych, a użytkownik przechodzi do Kroku 2.

### AC-2: Krok 2 - Dodawanie Zdjęć i Wybór Trybu
- [ ] Ekran `projects/new/images.tsx` pozwala na dodanie zdjęć z aparatu lub galerii.
- [ ] Po dodaniu zdjęć pojawia się wybór trybu: "Automatyczny" (domyślny) lub "Zaawansowany".
- [ ] W trybie "Automatyczny" wyświetlana jest tylko informacja o liczbie dodanych zdjęć i przycisk "Utwórz audiobooka".
- [ ] W trybie "Zaawansowany" wyświetlana jest lista zdjęć z możliwością zmiany kolejności, usuwania i edycji obszarów (istniejąca logika).

### AC-3: Optymalizacja Uploadu Zdjęć (Frontend)
- [ ] Każde zdjęcie (niezależnie od formatu) przed wysłaniem na serwer jest skalowane do maksymalnej szerokości 1600px.
- [ ] Zdjęcia są kompresowane do formatu JPEG z wysoką jakością (np. 95%), aby zachować ostrość tekstu dla OCR przy jednoczesnym zmniejszeniu wagi pliku.

### AC-4: Smart Batching OCR (Backend)
- [ ] Backend udostępnia endpoint `POST /projects/:id/process-ocr-batch`.
- [ ] Endpoint dzieli zdjęcia na paczki po maksymalnie 5 sztuk.
- [ ] Endpoint dodatkowo pilnuje bezpiecznego rozmiaru payloadu na podstawie faktycznego rozmiaru pobranych plików, aby nie zbliżać się do limitu 10MB na zapytanie.
- [ ] Paczki są wysyłane do Google Vision API równolegle lub sekwencyjnie, nie przekraczając limitów (max 16 zdjęć i 10MB na zapytanie).
- [ ] Wyniki OCR są zapisywane w bazie danych dla odpowiednich stron/obszarów.
- [ ] Dla przepływu automatycznego endpoint umożliwia oznaczenie rozpoznanych scen jako `ready_for_audio`, aby TTS mógł wystartować bez ręcznej korekty.

### AC-5: Przepływ Trybu Automatycznego
- [ ] Po kliknięciu "Utwórz audiobooka" w trybie automatycznym, aplikacja w tle:
  1. Wysyła zoptymalizowane zdjęcia na serwer.
  2. Wywołuje `process-ocr-batch`.
  3. Wywołuje `generate-audio` (TTS).
- [ ] Podczas tego procesu użytkownik widzi ekran ładowania/postępu.
- [ ] Po zakończeniu użytkownik jest przekierowywany bezpośrednio do odtwarzacza (`projects/[id]/player`).

### AC-6: Przepływ Trybu Zaawansowanego
- [ ] Po kliknięciu "Dalej" w trybie zaawansowanym, aplikacja:
  1. Wysyła zdjęcia i wywołuje `process-ocr-batch`.
  2. Przekierowuje użytkownika do Kroku 3 (`projects/new/review.tsx`).
- [ ] Krok 3 pozwala na podgląd każdego zdjęcia i edycję rozpoznanego tekstu.
- [ ] Po zatwierdzeniu Kroku 3, aplikacja wywołuje `generate-audio` i przekierowuje do odtwarzacza.
