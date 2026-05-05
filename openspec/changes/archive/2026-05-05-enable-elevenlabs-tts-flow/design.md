## Context

Aplikacja ma już podstawową ścieżkę TTS: `apps/api/src/routes/audio.ts` udostępnia `POST /projects/:projectId/generate-audio` i `GET /projects/:projectId/audio-tracks`, a `apps/api/src/lib/tts.ts` przełącza provider mock/ElevenLabs przez `TTS_PROVIDER`. Ekran mobile `projects/[id]/voice.tsx` potrafi wybrać głos i wywołać generowanie audio, ale użytkownik nie ma wystarczająco czytelnego przejścia po OCR, a zakładka „Głos i audio” opiera się na głosach zapisanych w tabeli `VoiceProfile`.

Problem zgłoszony przez użytkownika najpewniej wynika z dwóch luk w przepływie: brak jednoznacznej akcji TTS w stanie `ready_for_tts` oraz brak automatycznego zasilenia listy głosów z ElevenLabs, gdy API key jest skonfigurowany, ale lokalna baza nie zawiera profili głosów. Dodatkowo ekran „Głos i audio” nie pokazuje wygenerowanych `AudioTrack`, mimo że nazwa ekranu sugeruje oba elementy.

## Goals / Non-Goals

**Goals:**

- Użytkownik widzi jasną akcję przejścia do generowania audio po zakończeniu OCR.
- Zakładka „Głos i audio” pokazuje głosy pasujące do języka projektu i planu użytkownika albo czytelny błąd konfiguracji.
- Backend potrafi dostarczyć głosy z istniejących `VoiceProfile` oraz zsynchronizować je z ElevenLabs, gdy provider jest aktywny i baza nie ma pozycji.
- Uruchomienie TTS używa istniejącego endpointu, statusów scen i background processing, a po zakończeniu odświeża listę audio.
- Ekran „Głos i audio” pokazuje istniejące `AudioTrack` oraz stan generowania/błędu dla scen.

**Non-Goals:**

- Brak zmian w OCR, uploadzie obrazów, storage obrazów, auth, sharing, deep linkach, billingach i limitach planów.
- Brak klonowania głosów, zaawansowanych ustawień ElevenLabs lub per-scene voice selection.
- Brak nowego systemu kolejek; pozostaje obecny in-process background worker.
- Brak migracji istniejących projektów poza opcjonalnym utworzeniem lub synchronizacją rekordów `VoiceProfile`.

## Decisions

### 1. Zachować istniejące REST endpointy TTS i rozbudować UX wokół nich

`POST /projects/:projectId/generate-audio` już obsługuje walidację wybranego głosu, status `ready_for_audio`, generowanie w tle, podmianę istniejących ścieżek i częściowe błędy. Implementacja powinna dodać brakującą widoczność w mobile: CTA na szczegółach projektu, gdy projekt jest `ready_for_tts` lub są sceny gotowe do audio, oraz wyraźny przycisk w „Głos i audio”.

Alternatywa: dodać nowy endpoint „next step” lub wizard flow. Odrzucamy to, bo obecny model API wystarcza, a problem dotyczy odkrywalności i zasilenia danych.

### 2. Użyć `VoiceProfile` jako lokalnego katalogu, ale zsynchronizować go z providerem

`GET /voices` powinien nadal zwracać `VoiceResponse` z lokalnej tabeli, bo model zawiera plan availability i stabilne ID aplikacji. Gdy `TTS_PROVIDER=elevenlabs`, `ELEVENLABS_API_KEY` jest ustawiony, a lokalny wynik jest pusty, backend powinien pobrać dostępne głosy z ElevenLabs, upsertować je do `VoiceProfile` z bezpiecznymi domyślnymi flagami dostępności i zwrócić użytkownikowi.

Alternatywa: zawsze proxy do ElevenLabs bez zapisu w DB. Odrzucamy to, bo projekt już ma model `VoiceProfile`, wybór głosu jest zapisany w projekcie, a plan limits wymagają lokalnych flag dostępności.

### 3. Rozdzielić stany wyboru głosu, gotowości scen i audio tracks w UI

Ekran „Głos i audio” powinien mieć trzy czytelne obszary: wybór głosu, akcję generowania oraz listę wygenerowanych ścieżek audio/statusów scen. Jeśli nie ma głosów, ekran pokazuje przyczynę: brak konfiguracji, brak głosów dla języka/planu albo błąd pobrania. Jeśli nie ma scen `ready_for_audio`, przycisk TTS wyjaśnia, że użytkownik musi zatwierdzić tekst po OCR.

Alternatywa: zostawić akcję tylko na ekranie scen. Odrzucamy to, bo użytkownik szuka procesu w „Głos i audio”, a projektowy flow powinien prowadzić od OCR do TTS bez zgadywania.

### 4. Nie zmieniać kontraktu audio storage ani offline cache

`AudioTrackResponse` może pozostać oparty o metadane ścieżki audio. Jeśli UI potrzebuje odtwarzalnego URL-a poza playlistą, należy użyć istniejącego wzorca generowania asset URL albo dodać go w sposób zgodny z playlistami i autoryzacją, bez zmiany offline cache.

## Risks / Trade-offs

- [Pusta baza głosów mimo poprawnego API key] → `GET /voices` uruchamia kontrolowaną synchronizację z ElevenLabs i zwraca jasny błąd, jeśli provider nie jest skonfigurowany.
- [ElevenLabs niedostępny lub rate limited] → endpoint zachowuje istniejące głosy z DB, a przy braku cache zwraca standardowy błąd `{ error, message, statusCode }`.
- [Użytkownik uruchamia TTS wielokrotnie] → zachować obecną semantykę re-generacji: istniejący `AudioTrack` sceny jest zastępowany, a sceny bez tekstu przechodzą w `audio_error`.
- [Częściowy błąd generowania] → nie blokować pozostałych scen; UI pokazuje statusy `audio_done` i `audio_error`.
- [Niekompatybilność z istniejącymi projektami] → nie wymagać migracji projektów; projekty bez `voiceId` nadal wymagają wyboru głosu przed TTS.

## Migration Plan

1. Dodać lub rozszerzyć backendową funkcję pobierania głosów w obrębie istniejącej abstrakcji TTS.
2. Rozszerzyć `GET /voices` o fallback/synchronizację ElevenLabs oraz testy dla pustej bazy, braku konfiguracji i filtrowania planu/języka.
3. Uzupełnić mobile o CTA po OCR, pełny ekran „Głos i audio” i odświeżanie audio tracks/statusów po `202`.
4. W razie problemów rollback polega na wyłączeniu `TTS_PROVIDER=elevenlabs` albo przywróceniu statycznych rekordów `VoiceProfile`; istniejące audio tracks pozostają zgodne.

## Open Questions

- Czy pierwsza synchronizacja głosów ma udostępniać wszystkie głosy dla planu `free`, czy tylko wybraną listę domyślną? Proponowane domyślne zachowanie: wszystkie zsynchronizowane głosy są dostępne dla `free` do czasu wprowadzenia ręcznej kuracji katalogu.
