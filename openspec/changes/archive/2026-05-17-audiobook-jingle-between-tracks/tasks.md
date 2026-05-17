## 1. Backend — obsługa prefiksu `local:`

- [x] 1.1 W `apps/api/src/routes/playlist.ts`, w funkcji `rebuildPlaylist`, dodaj warunek: jeśli `project.interstitialPreset?.startsWith('local:')`, pomiń wstrzyknięcie wstawek i buduj playlistę wyłącznie ze scen
- [x] 1.2 Napisz test Vitest w `apps/api` weryfikujący, że `buildPlaylist` dla projektu z `interstitialPreset: 'local:page-turn-1'` zwraca tylko elementy `type: 'scene'`
- [x] 1.3 Napisz test Vitest weryfikujący, że standardowy preset (bez prefiksu `local:`) nadal wstrzykuje wstawki jak dotychczas

## 2. Frontend — moduł `local-jingles`

- [x] 2.1 Utwórz plik `apps/mobile/lib/local-jingles.ts` z tablicą `LOCAL_JINGLES` zawierającą wpisy dla `local:page-turn-1` (page-turn-1.mp3), `local:page-turn-2` (page-turn-2.wav) i `local:page-turn-3` (page-turn-3) z polami `name`, `label`, `icon` i `asset` — `icon: '🔔'` dla pierwszych dwóch, `icon: '🎙️'` dla trzeciego
- [x] 2.0 Dodaj plik `page-turn-3` do `apps/mobile/assets/audio/` (format do ustalenia: mp3 lub wav)
- [x] 2.2 Dodaj funkcję pomocniczą `getLocalJingle(name: string)` zwracającą pasujący wpis lub `undefined`

## 3. Frontend — kreator projektu (`projects/new/index.tsx`)

- [x] 3.1 Usuń fetch `/interstitial-presets` (`api.getInterstitialPresets()`) i powiązany stan `presets`
- [x] 3.2 Zastąp sekcję wyboru presetu listą `PickerCard` generowaną z `LOCAL_JINGLES` — każda karta wyświetla `icon` i `label` z wpisu
- [x] 3.3 Ustaw domyślnie zaznaczony preset na `LOCAL_JINGLES[0].name`
- [x] 3.4 Upewnij się, że `canSubmit` i `handleCreate` przesyłają wybrany `name` jako `interstitialPreset` do backendu bez zmian w sygnaturze API

## 4. Frontend — odtwarzacz (`projects/[id]/player.tsx`)

- [x] 4.1 Po pobraniu playlisty ze scen z backendu, sprawdź `project.interstitialPreset` — jeśli zaczyna się od `local:`, wstrzyknij lokalną wstawkę in-memory między sceny
- [x] 4.2 Użyj `Asset.fromModule(jingle.asset).uri` do resolwowania URI lokalnego pliku audio dla elementów wstawki
- [x] 4.3 Wczytaj asset przed inicjalizacją playlisty, aby odczytać rzeczywisty `durationMillis` i użyć go w wstrzykniętych elementach wstawki
- [x] 4.4 Upewnij się, że wstrzyknięte elementy mają `type: 'interstitial'` i są wykluczone z listy scen (istniejący filtr `sceneItems` powinien to obsłużyć bez zmian)
- [x] 4.5 Pobierz `project.interstitialPreset` — zweryfikuj, że `api.getProject(id)` lub istniejący fetch projektu zwraca to pole i jest dostępne w playerze

## 5. Testy mobilne

- [x] 5.1 Napisz test Jest dla `local-jingles.ts` — weryfikuj, że `LOCAL_JINGLES` zawiera trzy wpisy, że `icon` jest `🔔` dla page-turn-1/2 i `🎙️` dla page-turn-3, i że `getLocalJingle` zwraca poprawne wyniki
- [x] 5.2 Napisz test Jest dla logiki wstrzyknięcia wstawek w playerze — dla playlisty 3 scen wynik powinien mieć 5 elementów: `[scene, jingle, scene, jingle, scene]`
- [x] 5.3 Zaktualizuj istniejące testy kreatora projektu (`__tests__/new-project-wizard.test.tsx`), aby nie oczekiwały fetch presetu z backendu

## 6. Weryfikacja

- [x] 6.1 Uruchom `npm run test:api` — wszystkie testy przechodzą
- [x] 6.2 Uruchom `npm run test:mobile` — wszystkie testy przechodzą
- [x] 6.3 Uruchom `npm run lint` — brak błędów
