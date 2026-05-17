## Context

`apps/mobile/app/(app)/projects/new/images.tsx` obsługuje tryb automatyczny kreatora (`runAutomaticFlow`). Podczas przetwarzania wyświetla nakładkę (`processingOverlay`) z trzema stanami: `uploading` → `ocr` → `audio`. Nakładka używa hardkodowanych wartości (`#18213d`, `#29355c`, `#06d6a0`, `#aebbd3`) zamiast tokenów z `audioFlowTokens`. Nie pokazuje osi czasu — widoczny jest tylko aktualny etap, bez informacji o postępie całości.

Design system zdefiniowany w `apps/mobile/components/audioflow.tsx` eksportuje:
- `audioFlowTokens` — kolory, spacing, radius, typografia
- `audioFlowStyles` — gotowe style (headlineMd, body, field, etc.)
- `GlassPanel` — komponent z glass surface i glassEdge border

## Goals / Non-Goals

**Goals:**
- Wymiana hardkodowanych kolorów w overlayU na tokeny `audioFlowTokens`
- Dodanie widocznej osi czasu 3 etapów (ukończony / aktywny / oczekujący)
- Użycie `GlassPanel` lub równoważnych stylów glass zamiast własnego `processingCard`
- Typografia z `audioFlowStyles.headlineMd` i `audioFlowStyles.body`
- Pearl accent (`t.color.accent.pearl`) zamiast `#06d6a0` w spinnerze i aktywnym kroku

**Non-Goals:**
- Zmiana logiki `runAutomaticFlow` (kolejność kroków, polling, błędy)
- Zmiany w backendzie, API, OCR/TTS, storage, auth
- Wydzielenie nowych ekranów ani route'ów
- Animacje między etapami poza tym co już daje `FadeZoomContent`

## Decisions

**1. Inline vs. wydzielony komponent `ProcessingStepTracker`**

Decyzja: oś czasu jako funkcja pomocnicza lub prosty inline fragment w `images.tsx`, bez wydzielania do `audioflow.tsx`.

Uzasadnienie: oś czasu 3 kroków jest specyficzna dla kreatora automatycznego; wydzielenie do design systemu byłoby przedwczesną abstrakcją. Jeśli w przyszłości pojawi się drugi ekran z takim samym wzorcem — wydzielić wtedy.

Alternatywa odrzucona: nowy eksport `StepTracker` w `audioflow.tsx` — zbyt duże scope dla jednego use-case.

**2. Kolorystyka aktywnego kroku**

Decyzja: aktywny krok używa `t.color.accent.pearl` (`#F0EAD6`) dla spinnera i ikonki, pasywne kroki `t.color.text.onSurfaceMuted`.

Uzasadnienie: `#06d6a0` (stary kolor) nie istnieje w tokenach design systemu. Pearl jest głównym akcentem AudioFlow.

**3. Struktura osi czasu**

Decyzja: pionowa lista kroków z ikonami (✓ / spinner / ○) i etykietami po prawej. Aktywny krok wyróżniony pearl. Linia łącząca kroki w formie separatora.

Alternatywa odrzucona: poziomy stepper — słabo skaluje się na małych ekranach i trudny do odczytu przy długich etykietach w j. polskim.

**4. Tło overlaya**

Decyzja: `backgroundColor: 'rgba(19, 19, 22, 0.94)'` spójna z `AudioFlowScreen` której tło to `#131316`.

Uzasadnienie: obecne `rgba(16, 19, 32, 0.92)` ma niebieskawa odcień niespójny z rdzeniem design systemu (wine/dark).

## Risks / Trade-offs

- [Brak testu wizualnego] Testy mobilne nie weryfikują renderowania stylów — ryzyko regresji wizualnej niewidocznej w CI → Mitygacja: manualna weryfikacja na symulatorze przed merge.
- [Kontrast pearl] Pearl (`#F0EAD6`) na ciemnym tle ma wysoki kontrast, ale spinner może być mniej widoczny niż poprzedni zielony → Mitygacja: użycie `pearlBright` (`#FBFCF8`) jeśli potrzeba.
- [Scope creep] Podobna nakładka w `review.tsx` (OCR loading state) może kusić ujednolicenia przy okazji → Mitygacja: scope tego change = tylko `images.tsx`.
