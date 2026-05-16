## Context

Kreator tworzenia audiobooka (`projects/new/`) ma dwa tryby: automatyczny i zaawansowany. Oba tryby wywołują OCR i TTS przez endpointy zwracające `202 Accepted` — praca dzieje się w tle. Dla trybu automatycznego klient już czeka na ukończenie TTS (`waitForGeneratedAudio`), ale brakuje analogicznego czekania na OCR. Tryb zaawansowany nie ma przycisku wyboru obszarów OCR na etapie listy zdjęć, a przycisk usunięcia używa tekstu zamiast ikony.

Komponent wyboru obszarów OCR (`touch-ocr-region-selection`) już istnieje i jest dostępny z widoku szczegółów projektu. Ekran korekty tekstu OCR (`review.tsx`, Krok 3) już istnieje i obsługuje `textarea` per zdjęcie oraz submit → TTS.

## Goals / Non-Goals

**Goals:**
- Gwarantowana sekwencja OCR→TTS w trybie automatycznym przez polling statusu scen.
- Przycisk wyboru obszarów OCR na karcie każdego zdjęcia w trybie zaawansowanym (Krok 2).
- Podmiana tekstu "Usuń" na ikonę kosza na karcie zdjęcia w trybie zaawansowanym.
- Nawigacja: submit Kroku 2 (tryb zaawansowany) → OCR → Krok 3 (korekta) → submit → TTS → odtwarzacz.

**Non-Goals:**
- Zmiany w backendzie (endpointy, modele danych, dostawcy OCR/TTS).
- Zmiany w systemie uwierzytelniania, limitów planów lub udostępniania.
- Redesign komponentu wyboru obszarów — reużycie istniejącego.

## Decisions

### 1. Polling OCR w trybie automatycznym — nowa funkcja `waitForOcrCompletion`

**Problem:** `processOcrBatch` zwraca `202`; `generateAudio` wywołane zaraz po nim może dostać sceny w statusie `ocr_processing` lub `queued`, co da puste audio.

**Decyzja:** Dodać `waitForOcrCompletion(projectId)` wzorowaną na istniejącej `waitForGeneratedAudio`. Polluje `api.getScenes(projectId)` co 1.5s (max 60 prób = 90s), kończy gdy brak scen z `ocr_processing` / `queued`. Po sukcesie `runAutomaticFlow` wywołuje `generateAudio`.

**Alternatywa odrzucona:** Wywołanie `generateAudio` z opóźnieniem (setTimeout) — kruche, nie uwzględnia zmiennego czasu OCR.

### 2. Przycisk obszarów OCR w Kroku 2 — reużycie istniejącego modala

**Problem:** Użytkownik nie może oznaczyć obszarów OCR przed uruchomieniem OCR w kreatorze zaawansowanym.

**Decyzja:** Na karcie zdjęcia w `renderAdvancedItem` dodać trzeci przycisk (ikona ramki/selekcji). Kliknięcie otwiera istniejący widok `touch-ocr-region-selection` jako modal (lub navigation push do istniejącego routera). Komponent już obsługuje zapis `TextRegion` przez API.

**Alternatywa odrzucona:** Budowa nowego komponentu selekcji — zbędna duplikacja.

### 3. Ikona zamiast tekstu dla przycisku usunięcia

**Decyzja:** Zamienić `<Text>Usuń</Text>` na `<Ionicons name="trash-outline" />` (lub analogiczna ikona z istniejącej biblioteki ikon w projekcie). Zachowanie bez zmian.

### 4. Przepływ Krok 2→3 w trybie zaawansowanym

`runAdvancedFlow` już nawiguje do `review.tsx` po OCR. Brak zmian architektonicznych — weryfikacja że `review.tsx` odbiera `projectId` i poprawnie wyświetla wyniki + submit → TTS → player.

## Risks / Trade-offs

- **Timeout OCR polling** → Mitigation: po 60 próbach (90s) wyświetlić błąd z możliwością ponowienia; nie blokować UI na zawsze.
- **Reużycie modala obszarów w kreatorze** → ryzyko że modal zakłada kontekst poza kreatorem (np. router). Mitigation: przetestować nawigację powrotną do Kroku 2 po zamknięciu modala.
- **Brak zmian w review.tsx** → weryfikacja manualna że istniejący Krok 3 obsługuje poprawny routing z Kroku 2 i że submit → TTS → player działa end-to-end.
