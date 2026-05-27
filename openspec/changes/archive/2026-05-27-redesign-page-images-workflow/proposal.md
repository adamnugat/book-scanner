## Why

Obecny przepływ tworzenia/edycji audiobooka rozbija pracę nad zdjęciami na kilka kolejnych ekranów (Zdjęcia stron → Sceny OCR → Głos Lektora), a karta zdjęcia używa strzałek do zmiany kolejności i nie pokazuje pełnego statusu przetwarzania zdjęcia. Użytkownik nie widzi w jednym miejscu, na jakim etapie (obszary → OCR → audio) jest każde zdjęcie, a submit przenosi go między ekranami zamiast po prostu „dokończyć" audiobook. Chcemy, by Krok 2 był jednym, samodzielnym ekranem, który prowadzi cały proces od dodania zdjęć aż po gotowy audiobook, a edycja obszarów i korekta OCR odbywały się w modalach bez opuszczania listy zdjęć.

## What Changes

- **BREAKING** Krok 2 (ekran zdjęć) staje się samodzielnym ekranem z **dynamicznym tytułem**: „Dodaj zdjęcia" gdy brak zdjęć, „Edytuj zdjęcia" gdy lista zawiera ≥1 zdjęcie.
- Dolne menu ekranu zdjęć dostaje **przycisk galerii (lewa)** i **przycisk aparatu (prawa)**; środek pozostaje przyciskiem submitu.
- **BREAKING** Karta zdjęcia zostaje przeprojektowana na układ trzykolumnowy:
  - kolumna 1: **uchwyt drag-and-drop** (paskowana ikona) z numerem porządkowym w środku, aktualizowanym po każdej zmianie kolejności;
  - kolumna 2: dwa wiersze — miniaturka + nazwa pliku oraz **rząd ikon statusu** (obszary → korekta OCR → audio) połączonych strzałkami, pokazujących sekwencyjny proces; ikony obszarów i korekty OCR mogą być wyszarzone z literą „A" gdy dany etap jest wyłączony w ustawieniach ogólnych;
  - kolumna 3: **przycisk edycji** (ponownie aktywuje klikalność ikon ukończonych etapów) oraz **kosz** do usunięcia zdjęcia.
- **BREAKING** Zmiana kolejności zdjęć tylko przez **drag-and-drop**; strzałki góra/dół zostają usunięte.
- Gdy lista zawiera zdjęcia, między tytułem a listą pojawia się **pasek z licznikiem** („Zdjęć N") oraz **przełączniki ustawień ogólnych**:
  - „wybór obszarów" — domyślnie wyłączony; włączenie umożliwia edycję rejonów OCR per zdjęcie;
  - „korekta OCR" — domyślnie wyłączona; włączenie zatrzymuje proces po OCR, aby umożliwić korektę tekstu per zdjęcie.
- **BREAKING** Submit nie zmienia widoku — uruchamia dla wszystkich zdjęć po kolei: **OCR** (całe zdjęcie lub tylko zaznaczone obszary; opcjonalny przystanek na korektę) → **TTS** (cały tekst lub tylko zmieniony fragment przy istniejącym audio). Po sukcesie pokazuje komunikat „Wszystkie zdjęcia zostały przetworzone" i przenosi użytkownika do **widoku szczegółów audiobooka** (odtwarzacz), a nie do osobnych ekranów Sceny OCR / Głos Lektora.
- **Wybór obszarów OCR** prezentowany jako **modal** z powiększonym zdjęciem (rysowanie wielu rejonów, „dodaj kolejny" / „zapisz"), zamiast nawigacji do osobnego ekranu.
- **Korekta tekstu OCR** prezentowana jako **modal** per zdjęcie (miniaturka u góry, edytowalne pole tekstowe, „Zapisz"), zamiast osobnego ekranu.
- Krok 1 (tytuł, lektor, język, wstawki) **pozostaje bez zmian**.

## Capabilities

### New Capabilities

- `page-images-workflow`: samodzielny ekran Kroku 2 — dynamiczny tytuł, footer z galerią/aparatem/submitem, pasek licznika i przełączniki ustawień ogólnych (wybór obszarów, korekta OCR), orkiestracja sekwencji OCR→TTS i przejście do szczegółów audiobooka po sukcesie.
- `page-image-status-card`: przeprojektowana karta zdjęcia — uchwyt drag-and-drop z numerem porządkowym, miniaturka + nazwa, sekwencyjny rząd ikon statusu (obszary/OCR/audio ze strzałkami i stanem „A"/wyszarzonym), przycisk edycji odblokowujący etapy, kosz.
- `inline-ocr-correction-modal`: korekta tekstu OCR w modalu (miniaturka + edytowalne pole + zapis), zastępująca osobny ekran korekty.

### Modified Capabilities

- `image-box-actions`: usunięcie wymagań o strzałkach reorder i trzech grupach akcji; karta zastąpiona układem trzykolumnowym z `page-image-status-card`.
- `incremental-page-submit-flow`: submit nie nawiguje do Scen OCR ani Głosu Lektora — uruchamia inline OCR→TTS i kończy na szczegółach audiobooka.
- `page-images-screen-ui`: footer zyskuje przyciski galerii i aparatu; edycja obszarów otwiera modal zamiast osobnego ekranu; brak przejścia do ekranu Głosu Lektora.
- `image-area-selection-in-wizard`: wybór obszarów prezentowany jako modal, bramkowany przełącznikiem „wybór obszarów" w ustawieniach ogólnych.
- `unified-ocr-region-editor`: współdzielony `OcrRegionEditor` osadzony w hoście modalnym na ekranie zdjęć (bez nawigacji do osobnej trasy).

## Impact

- **apps/mobile**: `app/(app)/projects/[id]/images.tsx` (orkiestracja, footer, pasek ustawień, modale), `app/(app)/projects/new/images.tsx` (spójność trybu zaawansowanego), `components/PageImageCard.tsx` (nowy układ + drag handle), nowy host modalny dla `OcrRegionEditor`, nowy modal korekty OCR, `components/audioflow.tsx` (`AudioFlowFooterMenu` — sloty galeria/aparat), `app/(app)/_layout.tsx` (dynamiczny tytuł, usunięcie/zmiana tras Sceny OCR/Głos w tym przepływie), `lib/api.ts` (klient submitu). Biblioteka drag-and-drop dla listy.
- **apps/api**: orkiestracja submitu może wymagać uruchomienia OCR i TTS dla całego projektu z poziomu ekranu zdjęć oraz **ponownej syntezy tylko zmienionych scen** po korekcie OCR przy istniejącym audio. Zachować kontrakt REST `{ error, message, statusCode }`, idempotencję i zachowanie 202/przetwarzania w tle endpointów OCR/TTS.
- **packages/shared**: ewentualne nowe pola statusu zdjęcia/sceny (obszary/OCR/audio) i kontrakty submitu.
- **Weryfikacja**: `npm run test:mobile`, `npm run test:api`, `npm run lint`, `npm run format:check`, `npm run build:api`.

## Non-Goals

- Brak zmian w Kroku 1 (tytuł, lektor, język, wstawki).
- Brak zmian w dostawcach OCR/TTS (`OCR_PROVIDER`, `TTS_PROVIDER`), w warstwie storage (S3/MinIO), w autoryzacji, planach/limitach i udostępnianiu projektów.
- Brak zmian w modelu rozliczeń i w logice odtwarzacza poza wejściem na szczegóły audiobooka po zakończeniu.
