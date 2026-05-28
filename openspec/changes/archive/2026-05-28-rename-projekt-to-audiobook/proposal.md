## Why

Aplikacja tworzy audiobooki z zeskanowanych stron książek, ale interfejs użytkownika nadal używa słowa „projekt" zamiast „audiobook". Powoduje to niespójność między przeznaczeniem produktu a tym, co widzi użytkownik — szczególnie w komunikatach alertów, nagłówkach ekranów i etykietach UI.

## What Changes

- Zastąpienie wszystkich widocznych dla użytkownika wystąpień „projekt/projekty/projektu" na „audiobook/audiobooki/audiobooka" w plikach aplikacji mobilnej (`apps/mobile`)
- Dotyczy: komunikatów alertów, tytułów ekranów, etykiet przycisków, tekstów pustych stanów, pasków użycia
- Nie dotyczy: nazw zmiennych, klas, tras URL, kluczy API, nazw plików, ani kodu backendowego

## Capabilities

### New Capabilities

Brak nowych funkcjonalności.

### Modified Capabilities

- `mobile-app-navigation`: zmiana tytułów ekranów (`Projekt` → `Audiobook`, `Edycja projektu` → `Edycja audiobooka`)
- `project-dashboard-ui`: zmiana etykiet i tekstów pustych stanów na dashboardzie

## Impact

- `apps/mobile` — pliki UI: `app/(app)/index.tsx`, `app/(app)/_layout.tsx`, `app/(app)/projects/[id]/index.tsx`, `app/(app)/projects/[id]/edit.tsx`, `app/(app)/projects/[id]/sharing.tsx`, `app/(app)/pricing/index.tsx`, `components/audioflow-global-navigation.tsx`, `components/AudioEditingMenu.tsx`, `lib/use-audio-player.ts`
- `apps/mobile/__tests__` — testy muszą odzwierciedlać nowe teksty UI
- Backend (`apps/api`), modele danych, trasy URL i typy w `packages/shared` pozostają bez zmian

**Non-goals:** zmiany w billing, sharing, OCR/TTS providers, storage, auth, ani w nazwach tras URL.

**Weryfikacja:** `npm run test:mobile`, `npm run lint`
