# Plan iteracyjnego wdrożenia MVP – Audiobook App

Źródło wymagań: `spec.md`
Iteracje: 0–12 (od pustego repo do kompletnego MVP)
Platformy: web + iOS + Android (Expo + React Native)

---

## Iteracja 0: Scaffold projektu i infrastruktura

### Cel
Stworzyć działający szkielet aplikacji z konfiguracją narzędzi, backendem, bazą danych i storage. Po tej iteracji projekt kompiluje się i uruchamia na wszystkich trzech platformach, nawet jeśli pokazuje tylko pusty ekran.

### Zakres
- Inicjalizacja projektu Expo (SDK najnowszy stabilny) z routingiem (expo-router)
- Konfiguracja TypeScript, ESLint, Prettier
- Scaffold backendu: framework (np. Express/Fastify/Hono), struktura katalogów, health check endpoint
- Baza danych: schemat początkowy, migracje, seed
- Storage: konfiguracja bucketu na pliki (obrazy, audio)
- Konfiguracja testów: framework testowy (Jest/Vitest), pierwszy test smoke
- Struktura monorepo lub podział na pakiety (frontend, backend, shared)
- Plik .env.example z wymaganymi zmiennymi środowiskowymi
- README z instrukcją uruchomienia

### Kryteria akceptacji
- AC-0.1: Projekt kompiluje się bez błędów na web, iOS i Android
- AC-0.2: Backend uruchamia się i odpowiada na GET /health z kodem 200
- AC-0.3: Baza danych jest dostępna i migracje przechodzą bez błędów
- AC-0.4: Storage bucket istnieje i jest dostępny programowo
- AC-0.5: Testy smoke przechodzą (minimum 1 test frontend, 1 test backend)
- AC-0.6: Linter i formatter nie zgłaszają błędów na czystym projekcie
- AC-0.7: README pozwala nowemu deweloperowi uruchomić projekt w <10 minut

### Testy walidacyjne
- T-0.1: `npx expo start --web` uruchamia aplikację bez crashu
- T-0.2: `npx expo run:ios` / `run:android` (lub emulator) uruchamia aplikację
- T-0.3: `curl http://localhost:<port>/health` zwraca 200
- T-0.4: Skrypt migracji bazy danych wykonuje się bez błędów na czystej bazie
- T-0.5: Test upload i download pliku do storage bucketu
- T-0.6: `npm test` (lub odpowiednik) przechodzi z wynikiem PASS
- T-0.7: `npm run lint` kończy się bez błędów

---

## Iteracja 1: Autentykacja i konta użytkowników

### Cel
Użytkownik może założyć konto, zalogować się, zresetować hasło. Chronione endpointy odrzucają niezalogowane requesty. Sesja jest utrzymywana po odświeżeniu/restarcie aplikacji.

### Zależności
- Iteracja 0 ukończona i zwalidowana

### Zakres
- Model User w bazie danych (id, email, hasło hash, created_at, updated_at)
- Endpointy: POST /auth/register, POST /auth/login, POST /auth/logout, POST /auth/reset-password
- Walidacja danych wejściowych (email, siła hasła)
- Token JWT lub sesja z odświeżaniem
- Middleware autoryzacyjny na backendzie
- Ekrany frontend: rejestracja, logowanie, reset hasła
- Zabezpieczony routing: niezalogowany → przekierowanie do logowania
- Przechowywanie tokenu/sesji po stronie klienta (SecureStore na mobile, httpOnly cookie na web)
- Obsługa błędów: nieprawidłowe dane, duplikat email, wygasły token

### Kryteria akceptacji
- AC-1.1: Nowy użytkownik może się zarejestrować podając email i hasło
- AC-1.2: Zarejestrowany użytkownik może się zalogować
- AC-1.3: Zalogowany użytkownik może się wylogować
- AC-1.4: Użytkownik może zainicjować reset hasła
- AC-1.5: Chronione endpointy zwracają 401 bez ważnego tokenu
- AC-1.6: Sesja przeżywa odświeżenie strony / restart aplikacji
- AC-1.7: Duplikat rejestracji tego samego emaila jest odrzucany z czytelnym błędem
- AC-1.8: Hasło jest przechowywane jako hash, nigdy jako plaintext

### Testy walidacyjne
- T-1.1: Rejestracja z prawidłowymi danymi → 201 + użytkownik w bazie
- T-1.2: Rejestracja z istniejącym emailem → 409
- T-1.3: Rejestracja z pustym hasłem → 400
- T-1.4: Logowanie z prawidłowymi danymi → 200 + token
- T-1.5: Logowanie z błędnym hasłem → 401
- T-1.6: Request na chroniony endpoint bez tokenu → 401
- T-1.7: Request na chroniony endpoint z ważnym tokenem → 200
- T-1.8: Wygasły token → 401
- T-1.9: Sprawdzenie w bazie, że kolumna password nie zawiera plaintextu
- T-1.10: Odświeżenie strony po zalogowaniu nie wyrzuca na ekran logowania

---

## Iteracja 2: Zarządzanie projektami (CRUD)

### Cel
Zalogowany użytkownik może tworzyć, przeglądać, edytować i usuwać projekty audiobookowe. Lista projektów jest ekranem startowym po zalogowaniu.

### Zależności
- Iteracja 1 ukończona i zwalidowana

### Zakres
- Model Project w bazie (id, owner_id, title, cover_url, language, voice_id, interstitial_preset, status, created_at, updated_at)
- Endpointy CRUD: POST /projects, GET /projects, GET /projects/:id, PUT /projects/:id, DELETE /projects/:id
- Autoryzacja: użytkownik widzi/edytuje/usuwa tylko własne projekty
- Statusy projektu: draft, ocr_processing, ready_for_tts, completed
- Ekran listy projektów (kafelki z okładką, tytułem, statusem, datą)
- Ekran tworzenia projektu (tytuł, język – reszta pól na razie opcjonalna)
- Ekran edycji projektu
- Potwierdzenie przed usunięciem
- Pusta strona z CTA gdy brak projektów

### Kryteria akceptacji
- AC-2.1: Zalogowany użytkownik może stworzyć projekt z tytułem i językiem
- AC-2.2: Lista projektów wyświetla wszystkie projekty bieżącego użytkownika
- AC-2.3: Użytkownik A nie widzi projektów użytkownika B
- AC-2.4: Użytkownik może edytować tytuł i język istniejącego projektu
- AC-2.5: Użytkownik może usunąć projekt po potwierdzeniu
- AC-2.6: Pusta lista wyświetla komunikat zachęcający do stworzenia projektu
- AC-2.7: Widok szczegółów projektu pokazuje wszystkie pola

### Testy walidacyjne
- T-2.1: POST /projects z ważnym tokenem → 201 + projekt w bazie
- T-2.2: GET /projects z tokenem użytkownika A → tylko projekty A
- T-2.3: GET /projects/:id projektu użytkownika B z tokenem A → 403
- T-2.4: PUT /projects/:id z nowymi danymi → 200 + dane zaktualizowane w bazie
- T-2.5: DELETE /projects/:id → 200 + projekt usunięty z bazy
- T-2.6: POST /projects bez tokenu → 401
- T-2.7: POST /projects bez wymaganych pól → 400
- T-2.8: Widok listy renderuje się poprawnie z 0, 1 i >5 projektami

---

## Iteracja 3: Upload i zarządzanie zdjęciami

### Cel
Użytkownik może dodawać zdjęcia stron do projektu (z aparatu, galerii lub dysku), zarządzać ich kolejnością i usuwać je. Zdjęcia trafiają do storage i są powiązane z projektem.

### Zależności
- Iteracja 2 ukończona i zwalidowana

### Zakres
- Model PageImage w bazie (id, project_id, storage_path, order_index, original_filename, file_size, mime_type, created_at)
- Endpointy: POST /projects/:id/images, GET /projects/:id/images, PUT /projects/:id/images/reorder, DELETE /projects/:id/images/:imageId
- Upload do storage z walidacją (format: JPEG/PNG/HEIC, max rozmiar: np. 20MB)
- Generowanie miniaturek (thumbnail) po uploadzie
- Zmiana kolejności zdjęć (drag & drop na frontendzie, PATCH reorder na backendzie)
- Mobile: wybór z aparatu lub galerii (expo-image-picker)
- Web: upload plików z dysku, obsługa drag & drop
- Batch upload wielu zdjęć naraz
- Podgląd miniaturek z numeracją i stanem

### Kryteria akceptacji
- AC-3.1: Użytkownik może dodać zdjęcie do projektu z galerii/dysku
- AC-3.2: Na mobile użytkownik może zrobić zdjęcie aparatem i dodać je do projektu
- AC-3.3: Na web użytkownik może przeciągnąć pliki do strefy drop
- AC-3.4: Batch upload wielu plików naraz działa na web
- AC-3.5: Zdjęcia wyświetlają się jako miniaturki z numeracją
- AC-3.6: Użytkownik może zmienić kolejność zdjęć przez drag & drop
- AC-3.7: Użytkownik może usunąć zdjęcie z projektu
- AC-3.8: Nieprawidłowy format pliku jest odrzucany z komunikatem
- AC-3.9: Plik przekraczający limit rozmiaru jest odrzucany

### Testy walidacyjne
- T-3.1: POST /projects/:id/images z plikiem JPEG → 201 + plik w storage
- T-3.2: POST z plikiem .txt → 400 (nieprawidłowy format)
- T-3.3: POST z plikiem >20MB → 400 (przekroczony limit)
- T-3.4: GET /projects/:id/images → lista obrazów z poprawną kolejnością
- T-3.5: PUT /projects/:id/images/reorder ze zmienioną kolejnością → 200 + nowa kolejność w bazie
- T-3.6: DELETE /projects/:id/images/:imageId → 200 + plik usunięty ze storage i bazy
- T-3.7: Upload obrazu do cudzego projektu → 403
- T-3.8: Miniaturka jest generowana i dostępna po uploadzie
- T-3.9: Batch upload 5 plików → 5 rekordów w bazie z kolejnością 1–5

---

## Iteracja 4: OCR – rozpoznawanie tekstu

### Cel
Po dodaniu zdjęć użytkownik klika "Dalej" i system tworzy sceny z rozpoznanym tekstem. OCR działa asynchronicznie z widocznymi statusami. Opcjonalnie użytkownik może zaznaczać regiony tekstu na zdjęciu.

### Zależności
- Iteracja 3 ukończona i zwalidowana

### Zakres
- Integracja Google Cloud Vision API (lub Document AI)
- Model Scene w bazie (id, project_id, page_image_id, ocr_text, edited_text, status, order_index, created_at, updated_at)
- Model TextRegion w bazie (id, page_image_id, x, y, width, height)
- Asynchroniczna kolejka przetwarzania OCR (np. BullMQ, Cloud Tasks, lub odpowiednik)
- Statusy sceny: queued, ocr_processing, ocr_done, ocr_error
- Endpoint: POST /projects/:id/process-ocr (inicjuje przetwarzanie)
- Endpoint: GET /projects/:id/scenes (lista scen ze statusami)
- Edytor regionów tekstu na zdjęciu (prostokątne zaznaczenia, opcjonalny krok)
- Jeśli brak regionów → OCR na całym zdjęciu
- Jeśli regiony zaznaczone → OCR tylko na zaznaczonych obszarach
- Obsługa polskiego i angielskiego w OCR
- Obsługa błędów: timeout, nieprawidłowy obraz, limit API

### Kryteria akceptacji
- AC-4.1: Kliknięcie "Dalej" po etapie zdjęć tworzy sceny odpowiadające zdjęciom
- AC-4.2: Każda scena ma status przetwarzania widoczny w UI
- AC-4.3: Po zakończeniu OCR scena zawiera rozpoznany tekst
- AC-4.4: OCR poprawnie rozpoznaje tekst polski i angielski
- AC-4.5: Użytkownik może opcjonalnie zaznaczać prostokątne regiony tekstu na zdjęciu
- AC-4.6: OCR z zaznaczonymi regionami przetwarza tylko te obszary
- AC-4.7: Błąd OCR nie blokuje całego projektu – inne sceny są przetwarzane dalej
- AC-4.8: Status kolejki jest aktualizowany w czasie zbliżonym do rzeczywistego

### Testy walidacyjne
- T-4.1: POST /projects/:id/process-ocr → 202 + sceny ze statusem "queued"
- T-4.2: Po przetworzeniu: scena ze statusem "ocr_done" i niepustym polem ocr_text
- T-4.3: Zdjęcie z polskim tekstem → rozpoznany tekst w alfabecie łacińskim z polskimi znakami
- T-4.4: Zdjęcie z angielskim tekstem → rozpoznany tekst angielski
- T-4.5: Scena z zaznaczonym regionem → OCR ograniczony do tego regionu (porównanie z pełnym OCR)
- T-4.6: Uszkodzony obraz → scena ze statusem "ocr_error" i czytelnym komunikatem
- T-4.7: Ponowne wywołanie OCR dla projektu z istniejącymi scenami → obsłużone bez duplikacji
- T-4.8: GET /projects/:id/scenes → lista scen z aktualnym statusem i kolejnością zgodną ze zdjęciami

---

## Iteracja 5: Edycja scen i tekstu OCR

### Cel
Użytkownik przegląda listę scen, edytuje tekst rozpoznany przez OCR, widzi podgląd zdjęcia źródłowego. Na desktopie edycja jest dwupanelowa (lista + edytor).

### Zależności
- Iteracja 4 ukończona i zwalidowana

### Zakres
- Ekran listy scen z nawigacją
- Edytor tekstu sceny (textarea z edycją pola edited_text)
- Podgląd zdjęcia źródłowego obok edytora
- Statusy sceny rozszerzone: ocr_done → needs_review → ready_for_audio → audio_generated
- Nawigacja prev/next między scenami
- Autozapis lub ręczny zapis zmian
- Dwupanelowy layout na desktopie: lista scen po lewej, edytor po prawej
- Endpoint: PUT /projects/:id/scenes/:sceneId (aktualizacja edited_text, status)
- Licznik znaków / słów dla edytowanego tekstu
- Oznaczenie scen, które nie były jeszcze przeglądane po OCR

### Kryteria akceptacji
- AC-5.1: Użytkownik widzi listę wszystkich scen projektu z ich statusami
- AC-5.2: Kliknięcie sceny otwiera edytor z tekstem OCR i podglądem zdjęcia
- AC-5.3: Użytkownik może edytować tekst i zapisać zmiany
- AC-5.4: Nawigacja prev/next przełącza między scenami
- AC-5.5: Na desktopie layout jest dwupanelowy (lista + edytor)
- AC-5.6: Status sceny zmienia się po edycji/akceptacji tekstu
- AC-5.7: Zmiany nie są tracone przy nawigacji między scenami

### Testy walidacyjne
- T-5.1: GET /projects/:id/scenes → lista scen z poprawnymi statusami
- T-5.2: PUT /projects/:id/scenes/:id z nowym tekstem → 200 + tekst zaktualizowany w bazie
- T-5.3: Nawigacja prev/next na pierwszej scenie → prev wyłączony; na ostatniej → next wyłączony
- T-5.4: Edycja tekstu i odświeżenie strony → tekst nadal zmieniony
- T-5.5: Scena bez edycji tekstu ma edited_text = null (używa ocr_text)
- T-5.6: Na viewporcie >1024px renderuje się dwupanelowy layout
- T-5.7: Szybka edycja 10 scen po kolei nie powoduje utraty danych ani błędów

---

## Iteracja 6: TTS – generacja audio (ElevenLabs)

### Cel
Użytkownik wybiera głos lektora, może odsłuchać próbkę. Po zatwierdzeniu tekstu generowane jest audio per scena. Audio jest przechowywane w storage.

### Zależności
- Iteracja 5 ukończona i zwalidowana

### Zakres
- Integracja ElevenLabs API
- Model VoiceProfile w bazie (id, elevenlabs_voice_id, name, language, preview_url, is_available_free, is_available_premium, is_available_max)
- Model AudioTrack w bazie (id, scene_id, storage_path, duration_ms, file_size, created_at)
- Endpoint: GET /voices?language=pl (lista głosów)
- Endpoint: POST /projects/:id/generate-audio (inicjuje TTS dla wszystkich gotowych scen)
- Asynchroniczna kolejka TTS (analogicznie do OCR)
- Statusy sceny po TTS: audio_generating, audio_done, audio_error
- Ekran wyboru głosu z odsłuchem próbki
- Przypisanie głosu do projektu (pole voice_id w Project)
- Obsługa limitów API ElevenLabs
- Generacja audio z pola edited_text (lub ocr_text jeśli edited_text jest null)

### Kryteria akceptacji
- AC-6.1: Użytkownik widzi listę głosów dostępnych dla wybranego języka
- AC-6.2: Użytkownik może odsłuchać próbkę głosu przed wyborem
- AC-6.3: Głos jest przypisywany do projektu, nie do pojedynczej sceny
- AC-6.4: Po kliknięciu "Generuj audio" uruchamiane jest TTS dla scen gotowych do audio
- AC-6.5: Status generacji audio jest widoczny per scena
- AC-6.6: Wygenerowane audio jest przechowywane w storage i odtwarzalne
- AC-6.7: Błąd TTS dla jednej sceny nie blokuje generacji pozostałych
- AC-6.8: Lista dostępnych głosów zależy od planu użytkownika (po wdrożeniu I-9)

### Testy walidacyjne
- T-6.1: GET /voices?language=pl → lista głosów z polskim wsparciem
- T-6.2: GET /voices?language=en → lista głosów z angielskim wsparciem
- T-6.3: Odsłuch próbki głosu → plik audio odtwarza się poprawnie
- T-6.4: POST /projects/:id/generate-audio → 202 + sceny ze statusem "audio_generating"
- T-6.5: Po przetworzeniu: scena ze statusem "audio_done" + AudioTrack w bazie
- T-6.6: AudioTrack jest odtwarzalnym plikiem audio (prawidłowy format, duration >0)
- T-6.7: Scena z pustym tekstem → pominięta lub oznaczona błędem (nie crash)
- T-6.8: Ponowna generacja audio dla projektu → nowe tracki zastępują stare

---

## Iteracja 7: Odtwarzacz audiobooka

### Cel
Audiobook jest playlistą scen z wstawkami między nimi. Player ma kontrolki play/pause, prev/next, pasek postępu i listę scen do nawigacji.

### Zależności
- Iteracja 6 ukończona i zwalidowana

### Zakres
- Model InterstitialPreset w bazie (id, name, audio_url, duration_ms)
- Model PlaylistItem w bazie (id, project_id, type: 'scene' | 'interstitial', reference_id, order_index)
- Endpoint: POST /projects/:id/build-playlist (buduje playlistę ze scen + wstawek)
- Endpoint: GET /projects/:id/playlist (zwraca playlistę z URLami audio)
- Komponent Player: play/pause, poprzednia strona, następna strona
- Pasek postępu (progress bar) bieżącego tracku i całego audiobooka
- Lista tracków z podświetleniem aktualnie odtwarzanego
- Skok do wybranej sceny z listy
- Nawigacja prev/next na poziomie playlisty (scene→interstitial→scene)
- Widok aktualnej sceny (numer, tekst) w czasie odtwarzania
- Responsywny player na web i mobile

### Kryteria akceptacji
- AC-7.1: Playlist jest generowany automatycznie po wygenerowaniu audio
- AC-7.2: Playlista składa się z tracków scen przeplatanych wstawkami
- AC-7.3: Player odtwarza tracki po kolei bez przerw
- AC-7.4: Play/pause działa poprawnie
- AC-7.5: Prev/next przechodzi między stronami (sceny, z pominięciem wstawek w nawigacji)
- AC-7.6: Pasek postępu pokazuje progress bieżącego tracku
- AC-7.7: Lista tracków pozwala skoczyć do wybranej sceny
- AC-7.8: Widok aktualnej sceny (numer, tekst) jest wyświetlany w playerze

### Testy walidacyjne
- T-7.1: POST /projects/:id/build-playlist → 200 + playlista z naprzemiennymi scenami i wstawkami
- T-7.2: GET /projects/:id/playlist → lista PlaylistItem z poprawnymi URLami audio
- T-7.3: Odtworzenie playlisty → audio odtwarza się bez błędów dekodowania
- T-7.4: Kliknięcie pause → audio się zatrzymuje; kliknięcie play → wznawia od tego samego miejsca
- T-7.5: Kliknięcie next na scenie 1 → przeskakuje do sceny 2 (nie do wstawki)
- T-7.6: Kliknięcie prev na scenie 2 → przeskakuje do sceny 1
- T-7.7: Kliknięcie na scenę 5 w liście → player przeskakuje do tracku sceny 5
- T-7.8: Playlista dla projektu bez wstawki → same sceny, bez pustych pozycji

---

## Iteracja 8: Udostępnianie i QR

### Cel
Użytkownik może udostępniać projekt innym zalogowanym osobom. Generowany QR prowadzi po zalogowaniu bezpośrednio do odtwarzacza projektu.

### Zależności
- Iteracja 7 ukończona i zwalidowana

### Zakres
- Model ProjectShare w bazie (id, project_id, shared_with_user_id, role: 'viewer', created_at)
- Model QrShareLink w bazie (id, project_id, deep_link_url, qr_image_url, created_at)
- Endpointy: POST /projects/:id/share, DELETE /projects/:id/share/:userId, GET /projects/:id/shares
- Endpoint: POST /projects/:id/qr (generuje QR + deep link)
- Role: owner (twórca) i viewer (tylko odtwarzanie)
- Viewer widzi projekt w "udostępnionych" i ma dostęp do odtwarzacza
- Viewer nie może edytować, usuwać ani udostępniać dalej
- Deep link: schema://project/:id/player (mobile) + fallback URL web
- QR kod do pobrania jako obraz
- Ekran zarządzania dostępem: lista osób z dostępem, dodawanie/usuwanie
- Niezalogowany odbiorca linku → ekran logowania → po zalogowaniu redirect do odtwarzacza

### Kryteria akceptacji
- AC-8.1: Owner może udostępnić projekt innemu użytkownikowi po emailu
- AC-8.2: Viewer widzi udostępniony projekt na swoim dashboard
- AC-8.3: Viewer może odtwarzać audiobook, ale nie może go edytować
- AC-8.4: Owner może odebrać dostęp viewerowi
- AC-8.5: Generowany QR zawiera deep link do projektu
- AC-8.6: Deep link po zalogowaniu otwiera bezpośrednio odtwarzacz projektu
- AC-8.7: Niezalogowany użytkownik z linku jest kierowany na logowanie, potem na player
- AC-8.8: QR jest do pobrania jako obraz (PNG)

### Testy walidacyjne
- T-8.1: POST /projects/:id/share z emailem istniejącego użytkownika → 201
- T-8.2: POST /projects/:id/share z emailem nieistniejącego użytkownika → 404
- T-8.3: GET /projects jako viewer → projekt udostępniony jest na liście
- T-8.4: PUT /projects/:id jako viewer → 403
- T-8.5: DELETE /projects/:id jako viewer → 403
- T-8.6: DELETE /projects/:id/share/:userId jako owner → 200 + viewer traci dostęp
- T-8.7: POST /projects/:id/qr → 201 + QR obraz w storage + deep_link_url
- T-8.8: Deep link zawiera ID projektu i jest poprawnym URL
- T-8.9: Viewer po odebraniu dostępu → GET /projects/:id → 403

---

## Iteracja 9: Cennik i limity użycia

### Cel
Aplikacja ma zakładkę cennika z trzema pakietami. Limity są egzekwowane (stron/msc, aktywne projekty, dostępne głosy). Użytkownik widzi swoje wykorzystanie.

### Zależności
- Iteracja 8 ukończona i zwalidowana

### Zakres
- Model SubscriptionPlan w bazie (id, user_id, plan_type: 'free'|'premium'|'max', pages_limit, projects_limit, started_at, expires_at)
- Tabela UsageTracking (id, user_id, period_month, pages_used, characters_processed, audio_seconds_generated, storage_used_bytes)
- Endpointy: GET /pricing (pakiety), GET /me/usage (bieżące wykorzystanie), GET /me/plan
- Ekran cennika z porównaniem pakietów Free / Premium / Max
- Dashboard wykorzystania: stron w bieżącym miesiącu, aktywnych projektów, storage
- Egzekwowanie limitów:
  - Free: 1 aktywny projekt, 30 stron/msc, ograniczone głosy
  - Premium: 10 projektów, 300 stron/msc, szersza pula głosów
  - Max: 50 projektów, 1500 stron/msc, pełna pula głosów
- Blokowanie akcji z czytelnym komunikatem po przekroczeniu limitu
- Filtrowanie głosów po dostępności w planie użytkownika (powiązanie z I-6)

### Kryteria akceptacji
- AC-9.1: Ekran cennika wyświetla 3 pakiety z porównaniem limitów i korzyści
- AC-9.2: Nowy użytkownik ma domyślnie plan Free
- AC-9.3: Dashboard wykorzystania pokazuje aktualne zużycie vs limit
- AC-9.4: Próba stworzenia 2. projektu na planie Free → blokada z komunikatem
- AC-9.5: Próba przetworzenia 31. strony na planie Free → blokada
- AC-9.6: Lista głosów jest filtrowana według planu użytkownika
- AC-9.7: Limity resetują się na początku nowego miesiąca rozliczeniowego

### Testy walidacyjne
- T-9.1: GET /pricing → lista 3 pakietów z limitami
- T-9.2: Nowo zarejestrowany użytkownik → GET /me/plan → plan_type: "free"
- T-9.3: GET /me/usage → poprawne wartości wykorzystania
- T-9.4: Użytkownik Free z 1 projektem → POST /projects → 403 z komunikatem o limicie
- T-9.5: Użytkownik Free z 30 przetworzonymi stronami → POST process-ocr z nowym zdjęciem → 403
- T-9.6: Użytkownik Premium z 5 projektami → POST /projects → 201 (w limicie)
- T-9.7: GET /voices jako Free → podzbiór głosów; jako Max → pełna lista
- T-9.8: Zmiana miesiąca → pages_used resetuje się do 0

---

## Iteracja 10: Cache offline i odtwarzanie

### Cel
Wygenerowane audio może być zbuforowane offline. Użytkownik może odsłuchiwać audiobook bez dostępu do internetu. Powrót online nie powoduje problemów.

### Zależności
- Iteracja 7 ukończona i zwalidowana (player)

### Zakres
- Mechanizm pobierania tracków audio do lokalnego storage (expo-file-system na mobile, Cache API / IndexedDB na web)
- Przycisk "Pobierz offline" per projekt
- Indykator statusu pobrania (postęp, ukończone, błąd)
- Odtwarzanie z lokalnego cache gdy brak sieci
- Detekcja stanu sieci (online/offline)
- Synchronizacja: po powrocie online sprawdzenie aktualności cache
- Usuwanie cache per projekt (aby zwolnić miejsce)
- Widok zajętości storage przez offline cache

### Kryteria akceptacji
- AC-10.1: Użytkownik może pobrać audio projektu do offline cache
- AC-10.2: Postęp pobierania jest widoczny
- AC-10.3: Po wyłączeniu sieci odtwarzanie działa z cache
- AC-10.4: Player wskazuje, że odtwarza z cache (offline mode)
- AC-10.5: Powrót online nie powoduje crashu ani duplikacji danych
- AC-10.6: Użytkownik może usunąć offline cache danego projektu
- AC-10.7: Widok informuje o zajętości storage

### Testy walidacyjne
- T-10.1: Pobranie offline → pliki audio dostępne w lokalnym storage
- T-10.2: Symulacja offline (airplane mode) → player odtwarza z cache
- T-10.3: Symulacja offline bez pobranego cache → komunikat o braku dostępu
- T-10.4: Powrót online → aplikacja wraca do normalnego trybu bez błędów
- T-10.5: Usunięcie cache → pliki usunięte z lokalnego storage
- T-10.6: Pobranie projektu z 10 scenami → wszystkie tracki dostępne offline
- T-10.7: Przerwanie pobierania w połowie → czytelny status, możliwość wznowienia

---

## Iteracja 11: Web-specific polish

### Cel
Dopracowanie doświadczenia webowego: drag & drop upload, batch operations, szybka edycja tekstu w dwupanelowym layout, filtrowanie projektów, responsywność desktop + tablet.

### Zależności
- Iteracje 0–9 ukończone i zwalidowane

### Zakres
- Drag & drop upload zdjęć (jeśli nie zrobione w pełni w I-3)
- Batch upload z progress bar per plik
- Dwupanelowy edytor scen z szybkim przełączaniem (keyboard shortcuts)
- Filtrowanie listy projektów po statusie (draft, ocr_processing, ready_for_tts, completed)
- Sortowanie projektów po dacie, tytule, statusie
- Monitoring statusu przetwarzania OCR/TTS dla większych projektów (widok batch)
- Responsywność: pełna obsługa desktop (>1280px) i tablet (768–1280px)
- Skróty klawiszowe dla najczęstszych akcji edycji
- Poprawki UX: ładowanie, skeleton loaders, toast notifications

### Kryteria akceptacji
- AC-11.1: Drag & drop upload zdjęć działa w przeglądarce
- AC-11.2: Batch upload 10+ plików z widocznym postępem per plik
- AC-11.3: Filtrowanie projektów po statusie działa poprawnie
- AC-11.4: Sortowanie projektów po dacie i tytule działa
- AC-11.5: Dwupanelowy edytor scen z keyboard shortcuts (Ctrl/Cmd+S zapis, arrows nawigacja)
- AC-11.6: Layout responsywny na desktop i tablet
- AC-11.7: Stany ładowania mają skeleton loaders zamiast pustego ekranu
- AC-11.8: Operacje użytkownika potwierdzane toast notyfikacjami

### Testy walidacyjne
- T-11.1: Drag & drop pliku w strefę → plik się uploaduje i pojawia w liście
- T-11.2: Batch upload 10 plików → 10 miniaturek z progress barami → 10 zdjęć w projekcie
- T-11.3: Filtr "completed" → widoczne tylko projekty ze statusem completed
- T-11.4: Sortowanie po dacie desc → najnowszy projekt na górze
- T-11.5: Ctrl+S w edytorze sceny → tekst zapisany (weryfikacja w API)
- T-11.6: Viewport 1440px → dwupanelowy layout; viewport 800px → jednopanelowy
- T-11.7: Ładowanie listy projektów → skeleton loader widoczny przed danymi
- T-11.8: Usunięcie projektu → toast "Projekt usunięty" pojawia się

---

## Iteracja 12: Integracja, hardening i walidacja MVP

### Cel
Pełna walidacja end-to-end, obsługa błędów, spójność cross-platform, performance, bezpieczeństwo. Po tej iteracji MVP jest gotowe do wewnętrznego release.

### Zależności
- Wszystkie poprzednie iteracje ukończone i zwalidowane

### Zakres
- Testy end-to-end pełnego flow: rejestracja → projekt → zdjęcia → OCR → edycja → TTS → player → QR
- Cross-platform: weryfikacja na web, iOS simulator, Android emulator
- Error handling: graceful degradation dla każdego etapu (sieć, API, storage)
- Stany asynchroniczne: czytelne komunikaty dla queued, processing, done, error
- Wznowienie pracy: zamknięcie i otwarcie aplikacji nie traci postępu projektu
- Security: upload walidacja server-side, access control na każdym endpoincie, rate limiting
- Performance: czas ładowania listy projektów <2s, upload zdjęcia <5s, player start <1s
- Czyszczenie: usunięcie dead code, console.log, TODO, tymczasowych rozwiązań
- Monitoring: logowanie błędów, basic error tracking

### Kryteria akceptacji
- AC-12.1: Pełny flow od rejestracji do odsłuchania audiobooka działa na web
- AC-12.2: Pełny flow działa na iOS
- AC-12.3: Pełny flow działa na Android
- AC-12.4: Utrata sieci w trakcie OCR/TTS → czytelny komunikat, możliwość wznowienia
- AC-12.5: Zamknięcie aplikacji w trakcie edycji → dane nie są tracone po powrocie
- AC-12.6: Użytkownik A nie ma dostępu do żadnych zasobów użytkownika B (chyba że udostępnione)
- AC-12.7: Upload złośliwego pliku (np. .exe zmieniony na .jpg) → odrzucony server-side
- AC-12.8: Lista 50 projektów ładuje się w <2s
- AC-12.9: Brak console.log, TODO, dead code w kodzie produkcyjnym

### Testy walidacyjne
- T-12.1: Test E2E web: rejestracja → stworzenie projektu → upload 3 zdjęć → OCR → edycja tekstu → wybór głosu → TTS → odtworzenie w playerze → generacja QR
- T-12.2: Test E2E iOS (simulator): ten sam flow co T-12.1
- T-12.3: Test E2E Android (emulator): ten sam flow co T-12.1
- T-12.4: Symulacja timeout API w trakcie OCR → status sceny "ocr_error" + przycisk retry
- T-12.5: Kill aplikacji w trakcie edycji → restart → tekst zachowany
- T-12.6: Pentest: próba dostępu do cudzego projektu przez manipulację ID w URL → 403
- T-12.7: Upload pliku z fałszywym rozszerzeniem → odrzucony na backendzie (sprawdzenie MIME)
- T-12.8: Benchmark: GET /projects dla 50 projektów → response time <2s
- T-12.9: `grep -r "console.log" src/` → 0 wyników (poza dedykowanym loggerem)
- T-12.10: `grep -r "TODO" src/` → 0 wyników
- T-12.11: Uruchomienie lintera na całym projekcie → 0 błędów

---

## Mapa zależności iteracji

```
I-0 ─→ I-1 ─→ I-2 ─→ I-3 ─→ I-4 ─→ I-5 ─→ I-6 ─→ I-7 ─→ I-8 ─→ I-9
                                                       │              │
                                                       └─→ I-10      │
                                                                      │
                                                  I-0..I-9 ─→ I-11 ─→ I-12
```

## Podsumowanie iteracji

| # | Nazwa | Kluczowy rezultat |
|---|-------|-------------------|
| 0 | Scaffold projektu | Projekt kompiluje się na 3 platformach |
| 1 | Autentykacja | Rejestracja, logowanie, chronione endpointy |
| 2 | Projekty CRUD | Tworzenie i zarządzanie projektami |
| 3 | Upload zdjęć | Zdjęcia w storage z zarządzaniem kolejnością |
| 4 | OCR | Rozpoznawanie tekstu ze zdjęć, asynchroniczna kolejka |
| 5 | Edycja scen | Edytor tekstu OCR z podglądem zdjęcia |
| 6 | TTS | Generacja audio ElevenLabs, wybór głosu |
| 7 | Player | Odtwarzacz playlisty z nawigacją |
| 8 | Sharing / QR | Udostępnianie projektu, deep linking |
| 9 | Cennik | Pakiety, limity, egzekwowanie |
| 10 | Offline | Cache audio, odtwarzanie offline |
| 11 | Web polish | Drag & drop, batch, responsywność |
| 12 | Hardening | E2E, security, performance, czyszczenie |
