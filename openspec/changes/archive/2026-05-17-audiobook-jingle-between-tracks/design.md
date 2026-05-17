## Context

Backend `rebuildPlaylist` (apps/api/src/routes/playlist.ts) buduje playlist interleaving scen i wstawek — szuka presetu w bazie danych po `project.interstitialPreset`. Jeśli nie znajdzie rekordu, używa pierwszego presetu z bazy. Aplikacja mobilna wysyła wybrany preset do backendu przy tworzeniu projektu i odtwarzacz pobiera gotową playlistę.

Trzy pliki audio (`page-turn-1.mp3`, `page-turn-2.wav`, `page-turn-3`) są bundlowane w `apps/mobile/assets/audio/`. Nie są one zarejestrowane w backendowej bazie danych `InterstitialPreset`. Pierwsze dwa to krótkie efekty dźwiękowe, trzeci to wstawka głosowa.

Bieżący ekran tworzenia projektu pobiera listę presetów z `/interstitial-presets` i wymaga wybrania jednego (`canSubmit` zależy od `selectedPresetName`).

## Goals / Non-Goals

**Goals:**
- Użytkownik wybiera lokalny plik audio (page-turn-1, page-turn-2 lub page-turn-3) jako wstawkę przy tworzeniu/edycji projektu.
- Odtwarzacz wstrzykuje wybrany lokalny dźwięk pomiędzy kolejnymi scenami.
- Wstawki nie są widoczne na liście scen (istniejący filtr `type === 'scene'` zostaje zachowany).
- Rozwiązanie działa offline (pliki zbundlowane).

**Non-Goals:**
- Brak zmian w backendowej tabeli `InterstitialPreset` ani w logice buildPlaylist.
- Brak uploadu plików do storage (MinIO/S3).
- Brak zmian w schemacie Prisma.
- Brak obsługi wstawek w trybie offline cache (istniejące zachowanie bez zmian).

## Decisions

### D1: Prefiks `local:` w polu `interstitialPreset`

Projekt zapisuje wybór lokalnego pliku jako `interstitialPreset: 'local:page-turn-1'`. Backend w `rebuildPlaylist` rozpoznaje prefiks `local:` i pomija wstrzyknięcie interstitiali — buduje playlistę wyłącznie ze scen. Frontend player wykrywa prefiks `local:`, pobiera playlistę (scene-only z backendu), a następnie wstrzykuje lokalny asset pomiędzy scenami in-memory.

**Alternatywy odrzucone:**
- *AsyncStorage per project* — wymaga synchronizacji poza głównym przepływem danych, trudniejszy w testowaniu.
- *Seed presetów w bazie* — wymaga migracji, uploadu plików do storage, setupu MinIO; nadmierna złożoność dla bundlowanych assetów.
- *Nowe pole `localJinglePreset` w bazie* — zmiana schematu Prisma + migracja dla prostego wymagania.

### D2: Mapowanie lokalnych assetów w osobnym module

Nowy plik `apps/mobile/lib/local-jingles.ts` definiuje mapę `name → require(asset)`. Player i wizard importują z tego modułu — nie ma `require` rozsypanych po ekranach.

```typescript
export const LOCAL_JINGLES = [
  { name: 'local:page-turn-1', label: 'Przewracanie strony 1', icon: '🔔', asset: require('../assets/audio/page-turn-1.mp3') },
  { name: 'local:page-turn-2', label: 'Przewracanie strony 2', icon: '🔔', asset: require('../assets/audio/page-turn-2.wav') },
  { name: 'local:page-turn-3', label: 'Wstawka głosowa',        icon: '🎙️', asset: require('../assets/audio/page-turn-3') },
];
```

Pole `icon` jest czytelnym emoji wyświetlanym w `PickerCard` obok etykiety — bez potrzeby dodawania zależności do biblioteki ikon.

### D3: Wstrzyknięcie wstawek w playerze (in-memory)

Po pobraniu playlisty ze scen player sprawdza `project.interstitialPreset`. Jeśli zaczyna się od `local:`, konstruuje rozszerzoną kolejkę w pamięci:

```
[scene0, jingle, scene1, jingle, scene2, ...]
```

Pozycja jingle ma `type: 'interstitial'`, `audioUrl` pochodzi z lokalnego assetu przez `Asset.fromModule(asset).uri`. Playlist items z backendu pozostają niezmienione — wstrzyknięcie następuje wyłącznie po stronie frontendu.

### D4: Wizard zastępuje fetch presetów lokalną listą

Ekran `projects/new/index.tsx` przestaje fetchować `/interstitial-presets`. Zamiast tego prezentuje `LOCAL_JINGLES` jako opcje `PickerCard`, każda z emoji z pola `icon` wyświetlanym obok etykiety. Pole `interstitialPreset` wysyłane do backendu to `name` z `LOCAL_JINGLES` (np. `'local:page-turn-1'`).

Dotyczy to też edycji projektu (`projects/[id]/index.tsx`) jeśli tam istnieje pole wyboru presetu — do weryfikacji.

## Risks / Trade-offs

- **Backend fallback na pierwszy preset** → Jeśli backend nie znajdzie `'local:page-turn-1'` w bazie, użyje pierwszego dostępnego presetu i wstrzyknie go do playlisty. Backend musi rozpoznać prefiks `local:` i zwrócić czystą playlistę scen. [Mitygacja: dodanie warunku `startsWith('local:')` w `rebuildPlaylist`.]
- **`Asset.fromModule` wymaga `expo-asset`** → Należy zweryfikować, że `expo-asset` jest dostępny w Expo SDK 54 (jest częścią Expo Core). [Brak mitigacji wymagana — standardowa zależność.]
- **Czas trwania (`durationMs`) lokalnego jingle** → Nieznam go statycznie. Player może użyć `0` jako fallback albo wczytać dźwięk wcześniej i odczytać `durationMillis`. Wpływa na globalny pasek postępu. [Mitygacja: wczytaj asset w tle przy inicjalizacji playlisty, użyj rzeczywistego `durationMillis`.]
- **Offline cache pomija wstawki** → Przy odtwarzaniu offline (z cache) interstitiale nie będą wstrzykiwane — istniejące zachowanie. Nie jest to regresja. [Akceptowalne dla MVP.]
