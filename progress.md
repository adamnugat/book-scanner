# Progress — Book Scanner MVP

## Iteracja 0: Scaffold projektu i infrastruktura
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (7/7 AC, 4/4 testy)
- Uwagi:
  - Monorepo npm workspaces: apps/api, apps/mobile, packages/shared
  - Backend: Express 5 + TypeScript + Prisma + S3 storage
  - Frontend: Expo SDK 52 + expo-router + React Native
  - Baza: PostgreSQL 16 (docker-compose), pełny schemat Prisma z 13 modelami
  - Storage: S3-compatible (MinIO lokalnie)
  - Testy: Vitest (API) + Jest (mobile), 3 testy smoke
  - Linting: ESLint + Prettier, zero błędów

## Iteracja 1: Autentykacja i konta użytkowników
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (8/8 AC, 17 testów API + 3 testy mobile, lint 0 błędów)
- Uwagi:
  - Backend: POST /auth/register, /login, /logout, /refresh, /reset-password, GET /auth/me
  - JWT: access token (15m) + refresh token (7d)
  - Hasła: bcryptjs, 12 rund
  - Middleware requireAuth na chronionych endpointach
  - Walidacja: email regex, hasło min. 8 znaków
  - Frontend: AuthProvider z login/register/logout, auto-restore sesji
  - Token storage: SecureStore (mobile) / localStorage (web)
  - Routing: (auth) group (login/register/reset) + (app) group (chroniony)
  - Reset hasła nie ujawnia istnienia konta (anti-enumeration)

## Iteracja 2: Zarządzanie projektami (CRUD)
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (7/7 AC, 14 testów API projects + 4 testy mobile, lint 0 błędów)
- Uwagi:
  - Backend: POST/GET/GET:id/PUT/DELETE /projects z requireAuth
  - Autoryzacja: owner-only dla edit/delete, shared access w GET :id
  - Walidacja: title wymagany, language pl/en
  - Statusy projektu: draft, ocr_processing, ready_for_tts, completed
  - Frontend: lista projektów z kafelkami (tytuł, status badge, język, data)
  - Empty state z CTA "Nowy projekt"
  - Formularz tworzenia/edycji z selektorem języka
  - Widok szczegółów z wszystkimi polami
  - Usuwanie z potwierdzeniem Alert
  - Shared types: ProjectResponse, CreateProjectRequest, UpdateProjectRequest
  - Łączna liczba testów: 35 (31 API + 4 mobile)

## Iteracja 3: Upload i zarządzanie zdjęciami
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (9/9 AC, 9 testów API images + 4 mobile, lint 0 błędów)
- Uwagi:
  - Backend: POST/GET/PUT reorder/DELETE /projects/:id/images za requireAuth + requireProjectOwner
  - Multer multipart upload z walidacją MIME (JPEG/PNG/HEIC) i rozmiaru (20MB)
  - Sharp thumbnail generation (300x400 WebP)
  - S3 storage: upload oryginału + thumbnail, delete obu przy usunięciu
  - Reorder przez $transaction z tablicą imageIds
  - Reusable middleware: requireProjectOwner
  - Frontend: ekran zdjęć z miniaturkami, numeracją, ↑/↓ reorder, delete z potwierdzeniem
  - Upload z galerii (allowsMultipleSelection) i aparatu (mobile only)
  - Shared types: PageImageResponse, ReorderImagesRequest
  - Łączna liczba testów: 44 (40 API + 4 mobile)

## Iteracja 4: OCR – rozpoznawanie tekstu
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (8/8 AC, 7 testów API scenes, lint 0 błędów)
- Uwagi:
  - OCR service abstraction: Google Cloud Vision + mock provider, przełączalne przez OCR_PROVIDER env
  - Google Vision: TEXT_DETECTION, DOCUMENT_TEXT_DETECTION, language hints pl/en
  - Region support: extractRegionText() filtruje bloki po bounding box overlap
  - POST /projects/:id/scenes/process-ocr → 202, async background processing
  - GET /projects/:id/scenes → lista scen ze statusami
  - POST /projects/:id/scenes/text-regions → zapis regionów tekstu
  - Async worker: queued → ocr_processing → ocr_done/ocr_error, per-scene try/catch
  - Re-run bez duplikacji — sprawdzanie istniejących pageImageIds
  - Status projektu: draft → ocr_processing → ready_for_tts
  - Frontend: ekran scen z polling (3s), status badges, przycisk "Uruchom OCR"
  - Frontend: ekran text-regions (opcjonalny krok z numeric input dla x/y/w/h)
  - Flow: Zdjęcia → (opcjonalnie) Regiony tekstu → Sceny/OCR
  - Shared types: SceneResponse, TextRegionInput, SaveTextRegionsRequest
  - Łączna liczba testów: 51 (47 API + 4 mobile)

## Iteracja 5: Edycja scen i tekstu OCR
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (7/7 AC, 7 nowych testów API, lint 0 błędów)
- Uwagi:
  - Backend: GET /scenes/:sceneId (z pageImage data), PUT /scenes/:sceneId (editedText + status)
  - Walidacja statusów: dozwolone needs_review, ready_for_audio, ocr_done
  - Frontend: ekran edytora sceny z TextInput multiline, Image preview
  - Word/char counter, dirty state indicator ("niezapisane")
  - Prev/next nawigacja z auto-save przy przejściu
  - Desktop dual-panel layout (>=1024px): sidebar z listą scen + main z image + editor
  - "Zapisz i zatwierdź" → ustawia status ready_for_audio
  - Łączna liczba testów: 58 (54 API + 4 mobile)

## Iteracja 6: TTS – generacja audio (ElevenLabs)
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (8/8 AC, 8 nowych testów API, lint 0 błędów)
- Uwagi:
  - TTS service abstraction: ElevenLabs (eleven_multilingual_v2) + mock provider
  - GET /voices?language=X — filtrowanie głosów po języku, zwraca preview URL
  - POST /projects/:id/generate-audio → 202, async background worker
  - Per-scene try/catch: błąd jednej sceny nie blokuje reszty
  - Pusta treść → audio_error (nie crash)
  - Re-generacja: kasuje stare AudioTrack i tworzy nowe
  - GET /projects/:id/audio-tracks — lista tracków posortowana wg scen
  - VoiceProfile z polami isAvailableFree/Premium/Max (gotowe na I-9)
  - Frontend: ekran wyboru głosu z FlatList, preview ▶/⏸, select → updateProject
  - Przycisk "Generuj audio" → naviguje do scen po uruchomieniu
  - Łączna liczba testów: 66 (62 API + 4 mobile)

## Iteracja 7: Odtwarzacz audiobooka
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (8/8 AC, 4 nowe testy API playlist, lint 0 błędów)
- Uwagi:
  - Backend: POST /build-playlist (buduje z interleave scene+interstitial), GET /playlist (zwraca URLs)
  - Playlista przeplatana wstawkami (interstitial preset z bazy)
  - Bez wstawki → same sceny, bez pustych pozycji
  - GET /playlist zwraca: audioUrl, durationMs, sceneText, sceneOrderIndex
  - Frontend: expo-av Audio.Sound player
  - Play/pause, prev/next (pomija wstawki), progress bar (track + global)
  - Auto-advance na koniec tracku (didJustFinish → playNext)
  - Lista scen z jump-to-scene, podświetlenie aktywnej
  - Widok aktualnej sceny (numer + tekst) w nagłówku playera
  - Auto-build playlisty przy pierwszym otwarciu
  - Łączna liczba testów: 70 (66 API + 4 mobile)

## Iteracja 8: Udostępnianie i QR
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (8/8 AC, 9 nowych testów API sharing, lint 0 błędów)
- Uwagi:
  - Backend: POST/GET/DELETE /share, POST/GET /qr z qrcode lib (PNG 512px)
  - GET /projects zwraca owned + shared (ProjectShare include project)
  - Viewer: read-only access, PUT/DELETE → 403
  - Revoke: natychmiastowa blokada viewera
  - Deep link: bookscanner://project/:id/player + web fallback URL
  - QR upload do S3, zastępowanie przy re-generacji
  - Frontend: ekran sharing z formularzem email, listą z revoke, QR display, Share API
  - Łączna liczba testów: 79 (75 API + 4 mobile)

## Iteracja 9: Cennik i limity użycia
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (7/7 AC, 8 nowych testów API pricing, lint 0 błędów)
- Uwagi:
  - Backend: GET /pricing (3 pakiety), GET /me/plan, GET /me/usage
  - Limits lib: getUserPlan, getUserUsage, checkProjectLimit, checkPageLimit, incrementPageUsage
  - Enforcement: POST /projects → checkProjectLimit (403), POST /process-ocr → checkPageLimit (403)
  - Voices filtrowane po planie: Free → isAvailableFree, Premium → isAvailablePremium, Max → wszystkie
  - Monthly reset: UsageTracking per userId + periodMonth (YYYY-MM), nowy miesiąc = nowy rekord
  - Frontend: ekran cennika z 3 kartami planów, dashboard UsageBar (kolory progowe), active badge
  - Przycisk "Cennik" w nagłówku ekranu projektów
  - Łączna liczba testów: 87 (83 API + 4 mobile)

## Iteracja 10: Cache offline i odtwarzanie
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (7/7 AC, frontend-only, lint 0 błędów)
- Uwagi:
  - offlineCache lib: downloadProject (incremental, expo-file-system/localStorage), getCachedPlaylist, deleteProjectCache, getCacheSize, getTotalCacheSize
  - useNetwork hook: Web (navigator.onLine + events), Mobile (@react-native-community/netinfo)
  - Player: cache-first loading, offline banner "📴", download progress, "✓ Offline (X MB)", delete cache
  - Offline → playlisty z localUri, online → z API
  - Powrót online → przeładowanie z API bez duplikacji
  - Łączna liczba testów: 87 (83 API + 4 mobile)

## Iteracja 11: Web-specific polish
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (8/8 AC, frontend-only, lint 0 błędów)
- Uwagi:
  - Toast component: ToastProvider/useToast, animated, success/error/info, auto-dismiss 3s
  - Skeleton loader: pulsing animation, ProjectCardSkeleton, ProjectListSkeleton
  - Filtrowanie projektów: chipy status (all/draft/ocr/tts/completed) z useMemo
  - Sortowanie projektów: date/title/status z przyciskami
  - Responsive grid: numColumns=2 na tablet (>=768px)
  - Keyboard shortcuts: Ctrl/Cmd+S → save, Alt+arrows → prev/next scena
  - Drag & drop upload: onDragOver/onDragLeave/onDrop z drop zone overlay
  - Per-file upload progress: sekwencyjny upload z status per plik
  - Toast na delete projektu i zapis sceny
  - Łączna liczba testów: 87 (83 API + 4 mobile)

## Iteracja 12: Integracja, hardening i walidacja MVP
- Status: ✅ ukończona
- Data rozpoczęcia: 2026-04-13
- Data zakończenia: 2026-04-13
- Walidacja: ✅ przeszła (9/9 AC, 9 nowych testów E2E+security, lint 0 błędów)
- Uwagi:
  - Rate limiting: apiLimiter (200/15min), authLimiter (20/15min)
  - Global error handler: 500 → generic message + stack logging
  - Magic bytes validation: JPEG (FF D8 FF), PNG (89 50 4E 47), HEIC — odrzuca fałszywe rozszerzenia
  - E2E test: full flow (project → images → OCR → edit → TTS → playlist → QR)
  - Security tests: 5 cross-user access checks → 403, magic bytes → 400, unauth → 401
  - Brak console.log w kodzie prod (tylko startup log + console.error w error handler)
  - Brak TODO/FIXME/HACK w kodzie
  - ESLint: 0 errors
  - FINALNA LICZBA TESTÓW: 96 (92 API + 4 mobile)

---

## MVP KOMPLETNE ✅
Wszystkie 13 iteracji (0-12) zakończone i zwalidowane.
Łączna baza testowa: 96 testów (92 API + 4 mobile), lint 0 błędów.
