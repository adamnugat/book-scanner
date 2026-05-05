# Book Scanner

Aplikacja do tworzenia audiobooków ze zdjęć książek. Web + iOS + Android (Expo + React Native).

## Wymagania

- **Node.js** >= 20
- **Docker** + Docker Compose (dla PostgreSQL i MinIO)
- **iOS Simulator** (macOS) lub **Android Emulator** — opcjonalnie, do testów mobile

## Szybki start

### 1. Sklonuj i zainstaluj zależności

```bash
git clone <repo-url> book-scanner
cd book-scanner
cp .env.example .env
npm install
```

### 2. Uruchom usługi lokalne

```bash
docker compose up -d
```

Uruchamia PostgreSQL (port 5432) i MinIO (port 9000, konsola na 9001).

### 3. Przygotuj bazę danych

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Stwórz bucket w MinIO

Otwórz http://localhost:9001, zaloguj się (minioadmin/minioadmin) i utwórz bucket `book-scanner`.

### 5. Uruchom backend

```bash
npm run dev:api
```

Sprawdź: http://localhost:3001/health

#### Google Cloud Vision OCR

Domyślnie backend używa mock OCR. Aby włączyć prawdziwy OCR, zapisz klucz service account JSON poza repozytorium, np. `~/secrets/book-scanner-google-vision.json`, i ustaw w `apps/api/.env`:

```env
OCR_PROVIDER=google
GOOGLE_APPLICATION_CREDENTIALS=/Users/<user>/secrets/book-scanner-google-vision.json
```

Nie wklejaj prawdziwego JSON do kodu, `package.json`, `.env.example` ani plików śledzonych przez git. Jeśli środowisko deploymentowe wymaga sekretów bez pliku, potrzebne pola z JSON to `project_id`, `client_email` i `private_key`.

Backend obsługuje wtedy albo pojedynczą zmienną `GOOGLE_CLOUD_CREDENTIALS_JSON` z całym JSON-em, albo zestaw `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_CLIENT_EMAIL` i `GOOGLE_CLOUD_PRIVATE_KEY`.

### 6. Uruchom aplikację

```bash
npm run dev:mobile
```

Otworzy się Expo Dev Server. Wybierz `w` (web), `i` (iOS) lub `a` (Android).

## Struktura projektu

```
book-scanner/
├── apps/
│   ├── api/             # Backend Express + Prisma
│   └── mobile/          # Expo app (web + iOS + Android)
├── packages/
│   └── shared/          # Współdzielone typy i stałe
├── docker-compose.yml   # PostgreSQL + MinIO
└── package.json         # Root workspace
```

## Komendy

| Komenda | Opis |
|---------|------|
| `npm run dev:api` | Uruchom backend (hot reload) |
| `npm run dev:mobile` | Uruchom Expo dev server |
| `npm test` | Uruchom wszystkie testy |
| `npm run test:api` | Testy backend |
| `npm run test:mobile` | Testy mobile |
| `npm run lint` | Linter |
| `npm run format` | Formatowanie Prettier |
| `npm run db:migrate` | Migracje Prisma |
| `npm run db:studio` | Prisma Studio (GUI bazy) |
| `npm run db:seed` | Seed danych |

## Stos technologiczny

- **Frontend**: Expo SDK 52, React Native, expo-router
- **Backend**: Express 5, TypeScript, Prisma ORM
- **Baza danych**: PostgreSQL 16
- **Storage**: S3-compatible (MinIO lokalnie, AWS S3 / R2 produkcja)
- **OCR**: Google Cloud Vision (od iteracji 4)
- **TTS**: ElevenLabs (od iteracji 6)
- **Testy**: Jest (mobile), Vitest (API)
