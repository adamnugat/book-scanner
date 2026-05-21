## Context

Ekran szczegółów projektu (`apps/mobile/app/(app)/projects/[id]/index.tsx`) używa `AudioFlowPlayerPanel` z `components/audioflow.tsx` jako inline odtwarzacza — z paskiem postępu, kontrolkami transportu (‹‹, -10s, play/pause, +10s, ››) i designem opartym o `GlassPanel` + `audioFlowTokens`. Hook `useAudioPlayer(projectId)` (`apps/mobile/lib/use-audio-player.ts`) zwraca pełny stan playera (`playlist`, `currentIndex`, `positionMs`, `durationMs`, `isPlaying`, `handlePlayPause`, `goToSceneIndex`, `jumpToScene`, `seekBy`, `handleDownloadOffline`, `handleDeleteCache`, `isCached`, `cacheSize`, `downloading`, `downloadProgress`, `isOfflineMode`).

Obecny ekran zaawansowanego odtwarzacza (`projects/[id]/player.tsx`) ma własny, prosty layout z hardkodowanymi kolorami (`#e94560`, `#16213e`, `#0f3460`) i nie korzysta z designu AudioFlow. Wyświetla `currentItem.sceneText` w `<Text numberOfLines={3}>`, listę scen w `FlatList` oraz sekcję offline (`handleDownloadOffline`, `handleDeleteCache`).

`PlaylistItemResponse` (z `@book-scanner/shared`) zawiera `sceneText: string | null` dla elementów typu `scene` — to ten sam tekst, który ma się pojawić w boxie transkrypcji.

## Goals / Non-Goals

**Goals:**
- Spójność wizualna `projects/[id]/player.tsx` z `projects/[id]/index.tsx` (ten sam panel `AudioFlowPlayerPanel`, ten sam `AudioFlowScreen`, te same tokeny `audioFlowTokens`, `GlassPanel`, `TopAppBar`).
- Nowy komponent `SceneTranscriptBox` z gradientową maską (góra/dół), wysokością równą dokładnie 5 linii tekstu i auto-scrollem proporcjonalnym do postępu sceny.
- Zachowanie pełnej funkcjonalności obecnego playera: lista scen z możliwością skoku, sekcja offline (download / cached / delete), banner offline.

**Non-Goals:**
- Brak per-word/per-line timestampów z TTS — auto-scroll proporcjonalny do `positionMs / durationMs`, nie do rzeczywistego tempa lektora.
- Brak zmian w `useAudioPlayer`, `offlineCache`, kontraktach API.
- Brak refaktoryzacji `AudioFlowPlayerPanel` — używamy go w obecnej formie.
- Brak zmian w schemacie Prisma / TTS / OCR / auth.

## Decisions

### 1. Reużycie `AudioFlowPlayerPanel` zamiast duplikatu kontrolek

**Problem:** Ekran zaawansowany ma własne `<Pressable>` kontrolki z hardkodowanymi stylami (`#e94560`, etc.), niespójne z designem AudioFlow.

**Decyzja:** `projects/[id]/player.tsx` SHALL importować `AudioFlowPlayerPanel`, `AudioFlowScreen`, `TopAppBar`, `RoundIconButton`, `GlassPanel`, `audioFlowTokens`, `audioFlowStyles` z `components/audioflow` i `AudioFlowGlobalMenuButton`, `AudioFlowTopChrome`, `AudioFlowBottomNavigation` z `components/audioflow-global-navigation`. Propsy `AudioFlowPlayerPanel` (`progress`, `currentTime`, `totalTime`, `isPlaying`, `onPlayPress`, `onPreviousPress`, `onNextPress`, `onSkipBack`, `onSkipForward`) podpinamy do hooka tak samo jak w `projects/[id]/index.tsx`.

**Alternatywa odrzucona:** Wyciągnąć kontrolki do nowego, jeszcze bardziej generycznego komponentu — niepotrzebna abstrakcja przy 2 użyciach.

### 2. Nowy komponent `SceneTranscriptBox` z gradientową maską

**Problem:** Brak gotowego komponentu do przewijanej transkrypcji z gradientową maską.

**Decyzja:** Nowy komponent `apps/mobile/components/SceneTranscriptBox.tsx`:

```typescript
type Props = {
  text: string | null;
  progress: number; // 0..1 — pozycja w bieżącej scenie
};
```

Implementacja:
- Zewnętrzny `<View>` o stałej wysokości `LINE_HEIGHT * 5` (5 linii) i `overflow: 'hidden'`.
- Wewnętrzny `<Animated.View>` (lub zwykły `<View>` z `transform: translateY`) zawiera `<Text>` z pełną transkrypcją, `lineHeight: LINE_HEIGHT` (np. 24).
- Maska: dwa nakładki `LinearGradient` z `expo-linear-gradient` umieszczone absolutnie u góry i u dołu kontenera, kolory `[t.color.background.deep1, 'transparent']` (góra) i `['transparent', t.color.background.deep1]` (dół), wysokość ~40 px każdy, `pointerEvents="none"`.
- Auto-scroll: oblicz `totalLines` z mierzonej wysokości `<Text>` przez `onLayout` (`measuredHeight / LINE_HEIGHT`). `scrollableLines = max(0, totalLines - 5)`. `translateY = -scrollableLines * LINE_HEIGHT * progress`. Aktualizacja `translateY` przy każdej zmianie `progress` z `useAudioPlayer`.
- Przy `text === null` lub pustym tekście: render fallback "Brak transkrypcji dla tej sceny" w kolorze `t.color.text.onSurfaceSubtle`.
- Przy zmianie sceny (`text` się zmienia): reset `translateY` na 0.

**Alternatywa odrzucona:** `ScrollView` z `scrollEnabled={false}` + `scrollTo` — działa, ale `translateY` jest prostsze i nie wymaga referencji `useRef`.

**Alternatywa odrzucona:** `react-native-masked-view` — dodatkowa zależność; gradienty `expo-linear-gradient` (już używany w wielu komponentach AudioFlow) wystarczą.

### 3. Layout ekranu — kolejność sekcji

**Decyzja:** Od góry do dołu w `<ScrollView>`:

1. `AudioFlowTopChrome` + `TopAppBar` z przyciskiem powrotu i `AudioFlowGlobalMenuButton` (jak w `projects/[id]/index.tsx`).
2. Banner offline (zachowany, restylowany do tokenów AudioFlow — `GlassPanel` + `t.color.warning`).
3. `GlassPanel` z nagłówkiem sceny: `audioFlowStyles.eyebrow` ("Scena N" / "Wstawka"), `audioFlowStyles.headlineMd` z tytułem projektu lub nazwą sceny.
4. `SceneTranscriptBox` (5 linii, gradient mask).
5. `AudioFlowPlayerPanel` (ten sam komponent co na detail screen).
6. Sekcja offline (`GlassPanel`): przycisk "Pobierz offline" / progress / status "✓ Offline (X MB)" + "Usuń cache".
7. `Text` "Sceny" (`audioFlowStyles.eyebrow`) + lista scen (`ScrollView` lub `FlatList` z `scrollEnabled={false}` w głównym `ScrollView`) — każda scena jako `GlassPanel`/`Pressable` z aktywnym stanem.
8. `AudioFlowBottomNavigation` z `active="player"`.

### 4. Auto-scroll transkrypcji — formuła

**Decyzja:** Przewijanie liniowe proporcjonalne do postępu sceny:

```
sceneProgress = durationMs > 0 ? positionMs / durationMs : 0;
visibleLines = 5;
scrollableLines = max(0, totalLines - visibleLines);
translateY = -scrollableLines * LINE_HEIGHT * sceneProgress;
```

Gdy `totalLines <= 5`, tekst nie przewija się (`translateY = 0`), gradient maska nadal renderowana dla spójności wizualnej.

Przy skoku do nowej sceny (`currentIndex` zmienione): `translateY` resetuje się do 0 (przez `useEffect` zależny od `currentItem.id`).

### 5. Mierzenie wysokości tekstu

**Decyzja:** Użyć `onLayout` na wewnętrznym `<Text>`:

```typescript
const onTextLayout = (e: LayoutChangeEvent) => {
  setMeasuredHeight(e.nativeEvent.layout.height);
};
const totalLines = Math.max(1, Math.round(measuredHeight / LINE_HEIGHT));
```

Pierwszy render: `measuredHeight = 0` → `totalLines = 1` → brak przewijania, transkrypcja widoczna od góry. Po pierwszym `onLayout` aktualizacja stanu i ponowny render z prawidłowym `scrollableLines`.

## Risks / Trade-offs

- **Brak per-word timestampów** → auto-scroll może być desynchronizowany z rzeczywistym tempem lektora (np. dłuższe pauzy między zdaniami). Mitigation: dokumentacja w spec, że to świadomy kompromis MVP; przyszłe rozszerzenie TTS o znaczniki czasowe → osobna zmiana.
- **Lista scen w głównym `ScrollView`** → jeśli scen jest dużo (>50), wirtualizacja `FlatList` traci się. Mitigation: dla MVP akceptowalne; przyszłe rozwiązanie — sticky header lub osobny modal "Wszystkie sceny".
- **`expo-linear-gradient` jako zależność** → sprawdzić `apps/mobile/package.json`; jeśli brakuje, dodać `expo install expo-linear-gradient`.
- **`onLayout` jednorazowe mierzenie** → przy zmianie sceny tekst też zmienia długość; `useEffect` z resetem `measuredHeight = 0` na zmianę `currentItem.id` wymusza ponowne zmierzenie.
- **Spójność designu** → reużycie `AudioFlowPlayerPanel` zapewnia identyczny wygląd, ale tła ekranu (cover image jak na detail screen?) nie kopiujemy — zaawansowany player ma neutralne tło `AudioFlowScreen` zamiast `coverImage`, bo użytkownik patrzy głównie na transkrypcję.

## Migration Plan

Brak migracji danych ani API. Zmiana czysto UI w `apps/mobile`. Stary plik `player.tsx.bak` (backup) można zostawić lub usunąć — bez wpływu na działanie.
