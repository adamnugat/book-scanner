## Context

Ekran szczegółów projektu (`apps/mobile/app/(app)/projects/[id]/index.tsx`) renderuje `AudioFlowPlayerPanel` z `audioflow.tsx`, ale wszystkie naciśnięcia (play, poprzedni, następny) kierują do osobnego ekranu `/(app)/projects/[id]/player`. Pełna logika audio (`Audio.Sound`, playlist z jingle'ami, offline cache, stan pozycji) żyje wyłącznie w `player.tsx` jako lokalny stan komponentu.

## Goals / Non-Goals

**Goals:**
- Wyekstrahować logikę audio `player.tsx` do hooka `apps/mobile/lib/use-audio-player.ts`.
- Umożliwić odtwarzanie inline na ekranie szczegółów bez przechodzenia do pełnego odtwarzacza.
- Rozszerzyć `AudioFlowPlayerPanel` o dynamiczną ikonę play/pause i dwa przyciski skip (−10 s / +10 s).
- Dodać przycisk „Zaawansowany odtwarzacz" pod panelem nawigujący do `player.tsx`.
- `player.tsx` nadal działa w pełni — refaktorowany wyłącznie do użycia hooka.

**Non-Goals:**
- Offline cache, pobieranie, zarządzanie planem, OCR/TTS, auth, sharing.
- Synchronizacja stanu odtwarzania między ekranami (każdy ekran tworzy własną instancję hooka).
- Kontrola tła / media session API.

## Decisions

### 1. Hook `useAudioPlayer` jako centralna abstrakcja audio

**Decyzja:** Wyciągnąć stan i logikę audio do `apps/mobile/lib/use-audio-player.ts` zwracającego: `{ playlist, loading, currentIndex, isPlaying, positionMs, durationMs, handlePlayPause, goToSceneIndex, seekBy, loadAndPlay, ... }`.

**Alternatywa odrzucona:** Context/Provider globalny — nadmiarowy; odtwarzacz nie musi być dostępny globalnie, wystarczy lokalny hook per-screen.

**Rationale:** Hook jest prostszy, testowalny, nie wymaga zmian w drzewie nawigacji ani nowych providerów.

### 2. Rozszerzenie props `AudioFlowPlayerPanel` (bez breaking change)

**Decyzja:** Dodać nowe opcjonalne propsy: `isPlaying?: boolean`, `onSkipBack?: () => void`, `onSkipForward?: () => void`. Istniejące wywołania (`index.tsx` przed refaktorem) nie łamią się — propsy opcjonalne z domyślami.

**Rationale:** Nie niszczymy istniejącego API. Ikona ▶/⏸ zależy od `isPlaying`.

### 3. Seek ±10 s przez `soundRef.current.setPositionAsync`

**Decyzja:** `seekBy(deltaMs)` oblicza `clamp(positionMs + deltaMs, 0, durationMs)` i wywołuje `sound.setPositionAsync(newPos)`.

**Rationale:** `expo-av` `Audio.Sound` udostępnia `setPositionAsync` — brak potrzeby dodatkowych zależności.

### 4. Brak synchronizacji stanu między ekranami

**Decyzja:** Ekran szczegółów i ekran pełnego odtwarzacza mają niezależne instancje hooka. Przejście do „Zaawansowanego odtwarzacza" ładuje playlist od nowa.

**Alternatywa odrzucona:** Globalna instancja audio przez Context — wymagałoby dużego refaktoru nawigacji i zarządzania cyklem życia dźwięku między ekranami.

**Rationale:** Prostota ważniejsza niż ciągłość odtwarzania przy przejściu między ekranami (to edge case).

## Risks / Trade-offs

| Ryzyko | Mitygacja |
|--------|-----------|
| Dwa ekrany mogą jednocześnie odtwarzać audio | `Audio.setAudioModeAsync` w hooku wyłączy poprzedni sound gdy nowy zacznie grać (natywny system audio); nie wymaga dodatkowej logiki |
| `player.tsx` po refaktorze może zmienić zachowanie jeśli hook ma subtelne różnice | Testy manualne obu ekranów; hook pokryty unit testem |
| Opcjonalne propsy w `AudioFlowPlayerPanel` mogą być zapomniane przez przyszłych autorów | Dodać komentarz w typach informujący, że brak `isPlaying` = ikona statyczna |
