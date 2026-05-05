## Context

Backend API obsługuje generację audio jako fire-and-forget na poziomie procesu (`POST /projects/:id/generate-audio` zwraca 202, a `generateAudioInBackground` w `apps/api/src/routes/audio.ts` w pętli woła `synthesizeSpeech` z `apps/api/src/lib/tts.ts` i zapisuje `AudioTrack` w Prisma + plik w storage S3/MinIO). Po zakończeniu pętli zmienia status projektu na `completed` jeśli żadna scena nie jest już w stanie `audio_generating`.

Aplikacja mobilna (`apps/mobile/app/(app)/projects/[id]/voice.tsx`) po wywołaniu `api.generateAudio(id)` jednorazowo wywołuje `refreshAudioState()` (pobierając `getScenes` i `getAudioTracks`), pokazuje alert „Generacja audio została uruchomiona” i ustawia widok w trybie „Audio w toku”. Później ekran nie odświeża stanu, więc gdy backend faktycznie zakończy syntezę, użytkownik nie widzi nowo wygenerowanej ścieżki ani komunikatu sukcesu, dopóki ręcznie nie ponowi nawigacji.

W projekcie nie ma kanału push (websocket / SSE), webhook ElevenLabs nie jest zintegrowany, a generacja jest synchroniczna względem własnego procesu API – więc jedynym sensownym kanałem aktualizacji UI w MVP jest polling po istniejących endpointach.

## Goals / Non-Goals

**Goals:**

- Po uruchomieniu generacji audio ekran „Głos i audio” samodzielnie wykryje zakończenie generacji (powodzenie i/lub błędy) bez konieczności wracania na ekran.
- Po zakończeniu wszystkich scen ekran pokaże użytkownikowi listę nowych `AudioTrack` oraz jednoznaczny komunikat sukcesu lub komunikat o częściowych błędach.
- Polling musi się zatrzymywać, gdy nie ma już generujących się scen, gdy ekran traci focus albo gdy komponent jest demontowany – tak, by nie generował niepotrzebnego ruchu sieciowego.
- Zachowujemy istniejący kontrakt API (`POST /projects/:id/generate-audio` → 202 z listą scen, `GET /projects/:id/audio-tracks`, `GET /projects/:id/scenes`).

**Non-Goals:**

- Nie wprowadzamy webhooka ElevenLabs ani innego kanału push (websocket/SSE) – to wykracza poza tę zmianę.
- Nie zmieniamy modelu wykonywania w tle (nadal in-process, bez kolejki) ani schematu Prisma.
- Nie ruszamy ścieżek storage, autoryzacji, planów ani innych ekranów (np. odtwarzacza, udostępniania).
- Nie modyfikujemy logiki samej syntezy w `apps/api/src/lib/tts.ts` ani providerów TTS.

## Decisions

### Polling po stronie klienta (Expo) zamiast push

**Decyzja:** Ekran `voice.tsx` uruchamia polling `getScenes`/`getAudioTracks` z interwałem ok. 3 sekund tylko wtedy, gdy projekt ma co najmniej jedną scenę w stanie `audio_generating`. Polling kończy się, gdy żadna scena nie jest już generowana albo gdy ekran traci focus / komponent się odmontuje.

**Alternatywy rozważane:**

- Webhook ElevenLabs → poza zakresem MVP, wymagałby publicznego URL i nowej tabeli/tematów; nie odpowiada też na pytanie „czy plik trafił do storage”, więc i tak wymagałby pollingu lub pubsub.
- Server-Sent Events / websocket → wymaga nowej infrastruktury w Express i nowej warstwy klienta; nadmiarowe dla obecnego MVP.
- Re-fetch tylko na ponowny focus (`useFocusEffect`) → użytkownik często zostaje na ekranie i tak nie zobaczyłby zakończenia bez ręcznej akcji.

**Rationale:** Polling po istniejących endpointach mieści się w aktualnej architekturze (REST + 202 + status scen w DB), nie wymaga zmian backendu poza drobną kosmetyką, a interwał 3 s mieści się dobrze w realnym czasie generacji ElevenLabs (kilka–kilkanaście sekund na scenę dla MVP).

### Stop-conditions pollingu

**Decyzja:** Polling kontroluje hook na bazie `useEffect`/`useFocusEffect` z `setInterval` i flagą „mounted”. Polling startuje tylko, gdy lokalny stan ma `generatingSceneCount > 0` po pobraniu danych. W każdym tiku sprawdzamy ponownie stan i przerywamy interwał, gdy żadna scena nie jest w `audio_generating`. Dodatkowo polling zatrzymuje się, gdy ekran traci focus (`useFocusEffect`'s cleanup) i przy demontażu komponentu.

**Alternatywy rozważane:**

- Polling globalny na poziomie aplikacji → komplikuje zarządzanie stanem i utrzymuje ruch sieciowy, gdy użytkownik nawet nie patrzy na ekran audio.
- Backoff wykładniczy → przeciążenie rozwiązania jak na MVP; stały interwał 3 s wystarcza.

### Komunikat zakończenia

**Decyzja:** Po przejściu z dowolnej liczby scen `audio_generating > 0` do `audio_generating === 0`, klient pokazuje:

- jeśli wszystkie sceny mają `audio_done` → krótki komunikat sukcesu (alert + zauważalna informacja w karcie statusu) i odświeżoną listę `AudioTrack`.
- jeśli są sceny w `audio_error` → komunikat informujący o liczbie scen z błędem oraz sugestię ponownego uruchomienia generacji dla nieudanych scen.

**Alternatywy:** Tylko zmiana stanu listy bez alertu → użytkownik łatwo ją przegapi; alert jest spójny z istniejącym wzorcem na tym ekranie (np. po starcie generacji).

### Minimalna zmiana po stronie API

**Decyzja:** Endpoint `POST /projects/:id/generate-audio` pozostaje semantycznie taki sam (202 + lista wszystkich scen po uaktualnieniu statusów). Sprawdzamy tylko, że odpowiedź faktycznie odzwierciedla `audio_generating` dla scen wybranych do batcha (już to robi `findMany` po update'ach). Brak nowych endpointów. `GET /projects/:id/audio-tracks` i `GET /projects/:id/scenes` nie wymagają zmian.

**Alternatywy:**

- Dedykowany endpoint statusu generacji (np. `GET /projects/:id/audio-status`) → niepotrzebny przy dwóch istniejących endpointach, które już pokrywają potrzebę.

### Strategia testowa

**Decyzja:**

- Backend: regression tests w `apps/api/__tests__/audio.test.ts` (już istnieją; dbamy, że nadal przechodzą).
- Mobile: nowy test `apps/mobile/__tests__/voice-audio.test.tsx`, który mockuje `api.getScenes`/`api.getAudioTracks` i `api.generateAudio`, używa `jest.useFakeTimers()` do przesunięcia czasu o interwał pollingu i sprawdza, że:
  1. ekran ponownie wywołuje `getScenes`/`getAudioTracks` dopóki istnieje scena `audio_generating`,
  2. po przejściu wszystkich scen w `audio_done` polling się zatrzymuje, lista audio się aktualizuje i pojawia się komunikat zakończenia,
  3. polling nie startuje, gdy nie ma scen w `audio_generating`.

## Risks / Trade-offs

- [Polling generuje stały ruch sieciowy, jeśli stop-condition zawiedzie] → Mitygacja: dwie niezależne stop-conditions (focus + brak `audio_generating`), wyraźny cleanup w `useEffect`/`useFocusEffect` i pokrycie w testach Jest.
- [Generacja zakończona po stronie API może być chwilowo niewidoczna z powodu cache HTTP / debouncingu] → Mitygacja: wywołania używają tego samego `apiFetch` co reszta aplikacji, bez własnego cache, a interwał 3 s zapewnia szybką reakcję.
- [Użytkownik może opuścić ekran zanim zauważy komunikat sukcesu] → Mitygacja: status projektu i tak przejdzie na `completed`, więc karta projektu na ekranie szczegółów (już używa `useFocusEffect`) odświeży się przy powrocie; brak regresji dla tego flow.
- [Serwer odpowie 401 podczas pollingu, bo token właśnie wygasł] → istniejący `apiFetch` wykonuje refresh tokena i ponawia request; polling się od tego nie psuje, bo nie trzymamy własnego loop'a tokenów.
- [Backend padnie w trakcie generacji w tle] → poza zakresem (zachowane obecne ograniczenia in-process); polling po prostu zostanie na „Audio w toku”, dopóki ktoś nie ponowi generacji – żadne nowe ryzyko vs. dziś.
