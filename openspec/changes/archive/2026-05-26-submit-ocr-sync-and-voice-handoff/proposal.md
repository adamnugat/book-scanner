## Why

Po utworzeniu projektu użytkownik wchodzi na ekran „Zdjęcia stron", aby dodać lub usunąć zdjęcia, ale obecny przycisk w stopce („Zapisz zmiany") nie wykonuje żadnej widocznej akcji synchronizującej stan z backendem — nie uruchamia OCR dla nowo dodanych zdjęć, nie sprząta artefaktów po usuniętych zdjęciach (pliki audio w storage zostają osierocone) i nie prowadzi użytkownika do następnego kroku. Powoduje to dezorientację („nie wiadomo, co robi"), nie wiadomo, czy w ogóle wykonuje się request do Google OCR, a w efekcie scenariusz inkrementalnej edycji zdjęć w już istniejącym projekcie nie ma jasnej ścieżki ukończenia.

## What Changes

- Zmień zachowanie przycisku w stopce ekranu `apps/mobile/app/(app)/projects/[id]/images.tsx` z cichego „Zapisz zmiany" na jasny przepływ submitu: po jednym kliknięciu zmiana ma zostać zapisana, OCR ma się wykonać dla nowo dodanych zdjęć, a stan po usuniętych zdjęciach ma zostać posprzątany — wszystko z widocznym statusem i komunikatami.
- Podczas submitu wyświetl wyraźny modal/overlay z postępem (lista plików w trakcie + komunikat o uruchomieniu OCR i sprzątaniu artefaktów). Komunikat błędu nie może być cichy.
- W backendzie `apps/api/src/routes/ocr.ts` rozszerz `POST /projects/:projectId/process-ocr-batch` o sygnał „nowe vs. usunięte" tak, aby było jednoznaczne, dla których obrazów uruchomić OCR (tylko dla `pageImage` bez sceny lub z `status='queued'`), oraz potwierdzaj, że żaden istniejący `Scene` z `ocr_done`/`ready_for_audio` nie jest niepotrzebnie reprocesowany w tym trybie. Tryb `force` pozostaje bez zmian.
- W backendzie `apps/api/src/routes/images.ts` (`DELETE /projects/:projectId/images/:imageId`) dodaj sprzątanie plików audio w storage: dla każdej kaskadowo usuwanej `AudioTrack` (przez relację `Scene → AudioTrack`) wykasuj plik z `storagePath` w S3/MinIO przed usunięciem rekordu `PageImage` (cascade DB zostaje, ale storage musi nadążyć).
- Po pomyślnym submicie przenieś użytkownika do widoku `apps/mobile/app/(app)/projects/[id]/voice.tsx` („Głos i audio") z parametrem zapytania wskazującym nowo zsynchronizowane `sceneId[]`. Ekran ma podświetlić nowe sceny w sekcji statusu TTS i pokazać informację „Możesz uruchomić TTS dla nowych zdjęć".
- Nawigacja zostaje wstrzymana do czasu zakończenia OCR + sprzątania; w razie błędu OCR użytkownik pozostaje na ekranie zdjęć z toast/alertem opisującym, ile scen się nie udało.

## Capabilities

### New Capabilities
- `incremental-page-submit-flow`: pojedynczy, jednoznaczny przycisk submitu na ekranie zdjęć projektu, który synchronizuje dodania i usunięcia, prowadzi OCR i przenosi do widoku głosu z podświetleniem nowych scen.

### Modified Capabilities
- `page-images-screen-ui`: zmiana semantyki dolnego przycisku — z „Zapisz zmiany" (zapis pendingów) na pełny submit (upload pendingów → OCR → sprzątanie → nawigacja), z widocznym stanem postępu.
- `google-cloud-vision-ocr`: jawny tryb inkrementalny `process-ocr-batch` (bez `force`), który pozostawia istniejące sceny z `ocr_done`/`ready_for_audio` nietknięte i procesuje wyłącznie nowe lub błędne sceny — udokumentowany w kontrakcie tego capability.
- `voice-audio-screen-ui`: przyjmowanie listy świeżo zsynchronizowanych `sceneId[]` z parametrów routingu i wizualne wyróżnienie tych scen wraz z komunikatem zachęcającym do uruchomienia TTS.

## Impact

- Workspace `apps/mobile`: `app/(app)/projects/[id]/images.tsx` (główne zmiany przycisku submitu, modal postępu, nawigacja), `app/(app)/projects/[id]/voice.tsx` (parsowanie nowych `sceneId`, podświetlenie), opcjonalnie `lib/api.ts` (nowy opcjonalny parametr lub stałe zachowanie inkrementalne — bez przebudowy istniejącego `processOcrBatch`).
- Workspace `apps/api`: `src/routes/ocr.ts` (dokładny kontrakt trybu inkrementalnego — istniejące zachowanie się już zgadza, ale wymaga utrwalenia testami i ewentualnej korekty w przypadku `ocr_error`), `src/routes/images.ts` (sprzątanie plików audio przy `DELETE` obrazu, korzystając z `deleteFile` w `lib/storage.ts`), brak zmian w schemacie Prisma.
- Workspace `packages/shared`: jeśli odpowiedź `process-ocr-batch` ma wprost zwracać listę nowo utworzonych `sceneId`, doprecyzować typ odpowiedzi (na ten moment zwracany jest pełny `SceneResponse[]`).
- Testy: dodać testy Vitest dla `process-ocr-batch` (tryb inkrementalny + sprzątanie audio po delete) oraz testy Jest dla ekranów `images.tsx` i `voice.tsx` (overlay submitu, nawigacja, podświetlenie nowych scen).
- Non-goals: brak zmian w warstwie auth/share, brak zmian w pricingu/limitach poza już istniejącym `checkPageLimit`, brak zmian w dostawcy OCR (Google Cloud Vision/mock), brak zmian w schemacie storage, brak modyfikacji generacji TTS samej w sobie (przycisk „Generuj audio" na ekranie głosu pozostaje bez zmian).
- Weryfikacja: `npm run test:api`, `npm run test:mobile`, `npm run lint`, `npm run format:check`, `npm run build:api`.
