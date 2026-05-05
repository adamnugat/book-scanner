## 1. Mobile – polling i komunikat zakończenia generacji audio

- [x] 1.1 W `apps/mobile/app/(app)/projects/[id]/voice.tsx` wydzielić logikę odświeżania (`refreshAudioState`) tak, by zwracała aktualne `scenes` i `audioTracks`, i dodać stałą interwału pollingu (np. 3000 ms) jako stałą modułu.
- [x] 1.2 Dodać efekt (lub `useFocusEffect`) startujący `setInterval`, który wykonuje `refreshAudioState`, gdy w stanie istnieje co najmniej jedna scena `audio_generating`; w przeciwnym razie nie startować ani natychmiast zatrzymać interwał.
- [x] 1.3 Zapewnić cleanup interwału w przypadku: utraty focusu ekranu, demontażu komponentu, przejścia liczby scen `audio_generating` do zera oraz błędu sieci podczas pollingu (logować i przerwać do kolejnego startu).
- [x] 1.4 Po przejściu z `generatingSceneCount > 0` do `generatingSceneCount === 0`: jeśli wszystkie nowe sceny to `audio_done`, pokazać komunikat sukcesu (np. `Alert` „Generacja audio zakończona”) i odświeżyć listę `audioTracks`; jeśli są sceny `audio_error`, pokazać komunikat z liczbą błędów i sugestią ponownego uruchomienia.
- [x] 1.5 Zachować istniejące `Alert`y i etykiety przycisku (`Najpierw wybierz głos`, `Zatwierdź tekst scen przed TTS`, `Generuj audio`) bez regresji wizualnej.

## 2. Mobile – testy

- [x] 2.1 Utworzyć `apps/mobile/__tests__/voice-audio.test.tsx`, który mockuje `lib/api` i `expo-router`, używa `jest.useFakeTimers()` i renderuje `VoiceSelectScreen`.
- [x] 2.2 Dodać test: po `generateAudio` ekran ponownie wywołuje `getScenes`/`getAudioTracks` (drugie i trzecie odpytanie po przesunięciu zegara o interwał), dopóki sceny mają status `audio_generating`.
- [x] 2.3 Dodać test: gdy wszystkie sceny przejdą w `audio_done`, polling przestaje się wywoływać po stop-condition i pojawia się komunikat sukcesu (np. mock `Alert.alert` jest wywołany z odpowiednim tytułem).
- [x] 2.4 Dodać test: gdy w wyniku generacji co najmniej jedna scena ma `audio_error`, pojawia się komunikat o częściowym błędzie zamiast komunikatu sukcesu, a polling się zatrzymuje.
- [x] 2.5 Dodać test: jeżeli przy pierwszym pobraniu danych nie ma scen `audio_generating`, polling nie jest startowany (liczba wywołań `getScenes` nie rośnie po przesunięciu zegara).

## 3. API – sanity check generacji

- [x] 3.1 Zweryfikować w `apps/api/src/routes/audio.ts`, że odpowiedź `202` z `POST /projects/:id/generate-audio` zwraca sceny z aktualnym statusem `audio_generating` dla wybranego batcha (bez zmiany kontraktu) i że istniejąca obsługa błędów scen pozostaje bez zmian.
- [x] 3.2 Uzupełnić/utrzymać testy w `apps/api/__tests__/audio.test.ts`, w szczególności scenariusz częściowych błędów (`audio_error`) i pełnego sukcesu (`audio_done` + `project.status = completed`).

## 4. Weryfikacja

- [x] 4.1 Uruchomić `npm run test:api` i potwierdzić, że istniejące testy generacji audio nadal przechodzą.
- [x] 4.2 Uruchomić `npm run test:mobile` i potwierdzić, że nowe testy `voice-audio.test.tsx` przechodzą.
- [x] 4.3 Uruchomić `npm run lint` i `npm run format:check` na poziomie repo i naprawić ewentualne problemy z formatowaniem.
- [x] 4.4 Manualnie sprawdzić na urządzeniu/symulatorze, że po kliknięciu „Generuj audio” licznik „Audio w toku” spada do zera bez ręcznego odświeżenia, lista wygenerowanych audio się aktualizuje, a użytkownik dostaje komunikat zakończenia.
