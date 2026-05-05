## Why

Po kliknięciu „Generuj audio” aplikacja mobilna pokazuje komunikat „Audio w toku: 1” i nie odświeża dłużej swojego stanu. Backend faktycznie generuje plik w tle (ElevenLabs zwraca audio poprawnie), ale ekran „Głos i audio” nie wykrywa zakończenia syntezy: nie pojawia się wygenerowany plik audio, nie zmienia się status scen ani nie ma żadnego potwierdzenia powodzenia. Użytkownik wychodzi z tego ekranu z wrażeniem, że TTS „nic nie robi”, mimo że całość kończy się poprawnie po stronie API.

## What Changes

- Ekran „Głos i audio” w aplikacji mobilnej będzie odpytywał API o stan scen i ścieżek audio dopóki istnieją sceny w statusie `audio_generating`, a po wykryciu końca generacji zaktualizuje listę audio i status TTS.
- Po zakończeniu generacji (wszystkie sceny mają status końcowy: `audio_done` lub `audio_error`) ekran pokaże wyraźny komunikat sukcesu lub komunikat o częściowych błędach, zamiast pozostawiać stały napis „Audio w toku”.
- Odświeżanie zatrzyma się, gdy żadna scena projektu nie jest już generowana, gdy ekran traci focus albo gdy użytkownik opuszcza widok – tak, aby nie pollować w nieskończoność.
- Endpoint `POST /projects/:id/generate-audio` pozostaje bez zmian funkcjonalnych, ale w odpowiedzi `202` lista scen zostanie zwrócona dopiero po zaktualizowaniu statusów na `audio_generating`, dzięki czemu klient od razu zobaczy zgodny stan startowy do pollingu (potwierdzenie obecnego zachowania).
- Tło generacji w `audio.ts` pozostaje zaplanowane synchronicznie wewnątrz procesu API – nie wprowadzamy webhooka ani zewnętrznej kolejki w tej zmianie (poza zakresem MVP).

## Capabilities

### New Capabilities

- (brak)

### Modified Capabilities

- `text-to-speech-generation`: wymóg „Zakładka Głos i audio pokazuje wygenerowane audio” zostaje rozszerzony o aktywne odświeżanie podczas generacji oraz o jednoznaczny komunikat zakończenia generacji audio.

## Impact

- Workspace `apps/mobile`: ekran `apps/mobile/app/(app)/projects/[id]/voice.tsx` (polling, komunikaty, sprzątanie po wyjściu z ekranu) oraz testy `apps/mobile/__tests__/voice-audio.test.tsx`.
- Workspace `apps/api`: minimalne uporządkowanie odpowiedzi `POST /projects/:id/generate-audio`, jeśli wymaga tego nowy scenariusz pollingu; bez zmian w warstwie storage, TTS provider ani schemacie bazy danych.
- Brak zmian w schemacie Prisma, S3, OCR ani w warstwie autoryzacji.
- Weryfikacja: `npm run test:api` (regression na `audio.test.ts`), `npm run test:mobile` (nowy test pollingu i komunikatu zakończenia), `npm run lint`, `npm run format:check`.
- Non-goals: nie wprowadzamy webhooków ElevenLabs, nie zmieniamy modelu wykonywania w tle (nadal in-process), nie modyfikujemy planów subskrypcji ani limitów, nie ruszamy uprawnień projektowych.
