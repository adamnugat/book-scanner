## Why

Obecny ekran zaawansowanego odtwarzacza (`projects/[id]/player.tsx`) używa własnego, prostego layoutu i nie jest zgodny ze stylem `AudioFlowPlayerPanel` użytym na ekranie szczegółów projektu. Brakuje też kluczowego elementu UX: przewijającej się transkrypcji aktualnie odtwarzanej sceny, która pozwoliłaby śledzić tekst w trakcie słuchania (przydatne przy nauce języka i recenzji jakości TTS).

## What Changes

- **Spójna stylistyka odtwarzacza**: ekran `projects/[id]/player.tsx` SHALL używać tego samego `AudioFlowPlayerPanel` co widok szczegółów projektu (`projects/[id]/index.tsx`), z identycznymi tokenami designu (`audioFlowTokens`), kontrolkami transportu i paskiem postępu.
- **Box transkrypcji bieżącej sceny**: nowy komponent `SceneTranscriptBox` wyświetlający tekst aktualnie odtwarzanej sceny (`currentItem.sceneText`) w kontenerze o stałej wysokości mieszczącym dokładnie 5 linii tekstu, z gradientową maską opacity na górze i na dole (płynne pojawianie i zanikanie linii). Tekst przewija się automatycznie proporcjonalnie do `positionMs / durationMs` bieżącej sceny.
- **Sekcja informacji o scenie i ścieżce**: zachowane informacje "Scena N / Wstawka", licznik postępu (czas bieżący / całkowity dla utworu i całego audiobooka), pasek scen do skoku.
- **Przycisk pobrania offline**: zachowana sekcja `offlineSection` (pobierz / pobieranie w toku / cached + usuń cache) bez zmian funkcjonalnych, przeniesiona w nowy layout.
- **Banner offline**: zachowany banner "Odtwarzanie z cache" / "Brak połączenia".

## Capabilities

### New Capabilities

- `advanced-player`: Ekran zaawansowanego odtwarzacza audiobooka z transkrypcją sceny w przewijanym boxie 5-liniowym z gradientową maską, kontrolkami `AudioFlowPlayerPanel`, listą scen i sekcją offline.

### Modified Capabilities

- `inline-audio-player`: rozszerzenie o reużycie `AudioFlowPlayerPanel` na ekranie zaawansowanego odtwarzacza (`projects/[id]/player.tsx`) — ten sam komponent panelu i te same tokeny stylu.

## Impact

- **apps/mobile**: `app/(app)/projects/[id]/player.tsx` (pełny redesign layoutu z reużyciem `AudioFlowPlayerPanel`, `AudioFlowScreen`, `TopAppBar`, `audioFlowTokens`); nowy komponent `components/SceneTranscriptBox.tsx`.
- **apps/mobile**: brak nowych zależności runtime (`expo-linear-gradient` jest już używany w projekcie; jeśli nie — należy dodać).
- **packages/shared**: brak nowych kontraktów — `PlaylistItemResponse.sceneText`, `positionMs`, `durationMs` z hooka `useAudioPlayer` wystarczają.
- **apps/api**: brak zmian.
- **Weryfikacja**: `npm run test:mobile`, `npm run lint`, `npm run format:check`.

**Non-goals**:
- Brak zmian w dostawcach TTS / formacie audio (brak per-word timestamps — transkrypcja przewija się liniowo, proporcjonalnie do postępu sceny).
- Brak zmian w `useAudioPlayer` ani w endpointach playlisty / scen / audio.
- Brak zmian w mechanizmie cache offline (`offlineCache`).
- Brak zmian w systemie udostępniania, auth, limitów planów, OCR.
