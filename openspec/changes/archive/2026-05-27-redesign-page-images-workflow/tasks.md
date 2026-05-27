## 1. Zależności i konfiguracja drag-and-drop

> DECYZJA D4 (użytkownik): native = `draggable-flatlist`+reanimated+gesture-handler; web reorder chwilowo wyłączony (zwykła lista).

- [x] 1.1 Zainstalowano: `react-native-draggable-flatlist@^4.0.3`, `react-native-reanimated@~4.1.1`, `react-native-gesture-handler@~2.28.0`, `react-native-worklets@0.5.1` (peer reanimated v4)
- [x] 1.2 babel-preset-expo SDK 54 auto-wstrzykuje worklets/plugin (NIE dodawać ręcznie — podwójny transform psuł kompilację); root owinięty w `GestureHandlerRootView`
- [x] 1.3 Mocki Jest dla gesture-handler / reanimated (`react-native-reanimated/mock`) / draggable-flatlist w `jest-setup.ts`
- [x] 1.4 `test:mobile` startuje; 9 padających testów to PRE-EXISTING (app.test, new-project-images-wizard — stary flow zastępowany tą zmianą), moje zmiany infra = 0 regresji

## 2. Backend — weryfikacja warunkowego OCR/TTS (ZWERYFIKOWANE: brak zmian backendu)

> Ustalenia: backend już wspiera cały przepływ. `generate-audio` bierze tylko sceny `ready_for_audio`, pomija `audio_done`. `updateScene` przyjmuje `status:'ready_for_audio'` (korekta re-kolejkuje TTS). `process-ocr-batch` ma flagę `markReadyForAudio` (korekta-OFF → prosto do TTS) i jest idempotentny dla scen już zOCR-owanych. OCR używa `textRegions` jeśli są, inaczej całe zdjęcie. `SceneResponse.pageImageId` istnieje → mapowanie statusu kart po stronie klienta. Zmiana jest wyłącznie mobile.

- [x] 2.1 Potwierdzić w `apps/api/src/routes/audio.ts`, że `generate-audio` przetwarza wyłącznie sceny `ready_for_audio` i pomija `audio_done` — POTWIERDZONE
- [x] 2.2 Gating „TTS tylko na zmienionym tekście" — NIE WYMAGANE (zachowanie scen `ready_for_audio` ↔ `audio_done` już to realizuje)
- [x] 2.3 Potwierdzić warunkowy OCR (obszary vs całe zdjęcie) — POTWIERDZONE (`ocr.ts` L141-148)
- [x] 2.4 `pageImageId` na scenie do mapowania statusu — OBECNE (`shared/types.ts`, `SceneResponse`)
- [x] 2.5 Testy `apps/api` — brak zmian backendu, nic do zrobienia

## 3. Karta zdjęcia — układ trzykolumnowy (`page-image-status-card`)

- [x] 3.1 Przebudować `apps/mobile/components/PageImageCard.tsx` na trzy kolumny: uchwyt+numer, dwa wiersze (miniaturka+nazwa, ikony statusu), edycja+kosz
- [x] 3.2 Kolumna 1: paskowany uchwyt drag-and-drop (Feather) z numerem porządkowym w środku, przeliczanym z indeksu listy
- [x] 3.3 Usunąć strzałki reorder (`arrow-up`/`arrow-down`) i ich stany disabled
- [x] 3.4 Kolumna 2 wiersz 2: rząd ikon statusu obszary → korekta OCR → audio połączonych strzałkami; ikona obszarów z licznikiem lub wyszarzona „A", ikona OCR aktywna po `ocr_done` lub wyszarzona „A", ikona audio aktywna gdy przypisany `AudioTrack`/`audio_done`
- [x] 3.5 Kolumna 3: przycisk edycji odblokowujący klikalność ikon ukończonych etapów oraz kosz (`trash-2`) usuwający zdjęcie
- [x] 3.6 Zachować współdzielenie komponentu między kreatorem (tryb zaawansowany) a ekranem zdjęć
- [x] 3.7 Zaktualizować/uzupełnić testy karty (`apps/mobile/__tests__`) — trzy kolumny, brak strzałek, stany ikon „A"/licznik/audio

## 4. Modale: wybór obszarów OCR i korekta tekstu OCR

- [x] 4.1 Dodać host modalny w `images.tsx` (`regionModalPageId`) renderujący współdzielony `OcrRegionEditor` w built-in `Modal` dla pojedynczego `pageImageId`; po zapisie odświeżyć `regionCounts`
- [x] 4.2 Utworzyć `OcrCorrectionModal` (miniaturka u góry, edytowalne pole tekstowe OCR, przycisk „Zapisz") otwierany per zdjęcie; zapis przez `updateScene({ editedText })`
- [x] 4.3 Usunąć nawigację do tras `projects/[id]/text-regions/[pageImageId]` i `projects/[id]/scenes/[sceneId]` w tym przepływie (zastąpione modalami)
- [x] 4.4 Testy: otwarcie/zamknięcie modala obszarów odświeża licznik; modal korekty zapisuje tekst i zamyka się; brak nawigacji do osobnych tras

## 5. Ekran zdjęć — tytuł, footer, pasek ustawień (`page-images-workflow`, `page-images-screen-ui`)

- [x] 5.1 Dynamiczny tytuł ekranu: „Dodaj zdjęcia" gdy brak zdjęć i pendingów, „Edytuj zdjęcia" gdy ≥1 (aktualizacja po dodaniu pierwszego / usunięciu ostatniego)
- [x] 5.2 Footer `AudioFlowFooterMenu`: lewy slot → galeria (`launchImageLibraryAsync`), prawy slot → aparat (`launchCameraAsync`), środek → submit (`createIcon='check'`, label „Wyślij i przetwórz", `createDisabled` gdy brak zmian)
- [x] 5.3 Pasek między tytułem a listą: licznik „Zdjęć N" + przełączniki „wybór obszarów" i „korekta OCR" (domyślnie wyłączone, resetowane w `useFocusEffect`); ukryty przy pustej liście
- [x] 5.4 Przełącznik „wybór obszarów" bramkuje aktywność ikony obszarów na kartach i otwieranie modala (off → wyszarzona „A")
- [x] 5.5 Przełącznik „korekta OCR" steruje zatrzymaniem procesu po OCR i dostępnością akcji „Korekta OCR" per zdjęcie
- [x] 5.6 Reorder przez `DraggableFlatList` (native) → `onDragEnd` → `reorderImages`; web używa zwykłej `FlatList` bez przeciągania (decyzja D4 „mobile teraz, web później"). Numery porządkowe z indeksu listy.

## 6. Orkiestracja submitu OCR→korekta→TTS→szczegóły (`incremental-page-submit-flow`)

- [x] 6.1 Rozszerzyć maszynę faz: `'idle' | 'uploading' | 'ocr' | 'correction' | 'tts' | 'done' | 'error'`
- [x] 6.2 Faza `uploading`: wysłać `pendingAssets`, zsynchronizować usunięcia i kolejność; overlay „Wysyłanie zdjęć…" z listą plików
- [x] 6.3 Faza `ocr`: `processOcrBatch` + odpytywanie `getScenes` do `ocr_done`/`ocr_error` (backoff + limit prób); overlay „Rozpoznawanie tekstu (OCR)…"
- [x] 6.4 Faza `correction` (tylko gdy przełącznik włączony): zatrzymać sekwencję, odblokować modale korekty per zdjęcie, wznowić po zatwierdzeniu
- [x] 6.5 Faza `tts`: `generateAudio` + odpytywanie do `audio_done`/`audio_error`; overlay „Generowanie audio (TTS)…"
- [x] 6.6 Faza `done`: `buildPlaylist`, komunikat „Wszystkie zdjęcia zostały przetworzone", nawigacja do widoku szczegółów audiobooka
- [x] 6.7 Obsługa błędów: przy `*_error` lub timeoutcie zamknąć overlay, zostawić użytkownika na ekranie, pokazać toast/`Alert` z komunikatem backendu; brak nawigacji do `scenes`/`voice`
- [x] 6.8 `createDisabled` gdy brak zmian (brak pendingów, usunięć, reorderu od ostatniego submitu)

## 7. Czyszczenie nawigacji i tras legacy

> Zakres: usunięto trasę `text-regions/[pageImageId]` (plik + rejestracja w `_layout`), zastąpioną modalem. Trasy `scenes`/`voice` POZOSTAJĄ zarejestrowane — używane przez ekran szczegółów projektu (ponowne generowanie audio) poza przepływem Kroku 2; proposal mówi „w tym przepływie". Kluczowy wymóg (submit nie nawiguje do scenes/voice) spełniony w `images.tsx`.

- [x] 7.1 Usunięto trasę `projects/[id]/text-regions/[pageImageId]` (plik + `_layout`); tytuł `images` ustawiany dynamicznie. `scenes`/`voice` zachowane dla ekranu szczegółów (poza tym przepływem)
- [x] 7.2 Brak osieroconych `router.push` do usuniętej trasy; submit `images.tsx` nie przekazuje `newSceneIds` (usunięty), nawiguje do `/(app)/projects/[id]`
- [x] 7.3 Przepisano `project-images.test.tsx` (tytuł, pasek ustawień, modal obszarów, pełna sekwencja submitu, stop na korekcie); testy `scenes`/`voice` pozostają (trasy żyją)

## 8. Weryfikacja końcowa

- [x] 8.1 `npm run test:mobile`
- [x] 8.2 `npm run test:api`
- [x] 8.3 `npm run lint`
- [x] 8.4 `npm run format:check`
- [x] 8.5 `npm run build:api`
- [x] 8.6 `graphify update .` aktualizuje graf po zmianach
