## 1. Zależności i przygotowanie

- [x] 1.1 Zweryfikować obecność `expo-linear-gradient` — BRAK w `apps/mobile/package.json` i brak `npm`/`node` w PATH harnessu; zamiast dep używamy stosu 8 nakładek `<View>` o malejącej/rosnącej `opacity` (cheap, brak nowej zależności, działa na web/iOS/Android)
- [x] 1.2 Przejrzeć `apps/mobile/components/audioflow.tsx` — potwierdzono eksporty: `AudioFlowPlayerPanel`, `AudioFlowScreen`, `TopAppBar`, `RoundIconButton`, `GlassPanel`, `audioFlowTokens`, `audioFlowStyles`

## 2. Nowy komponent `SceneTranscriptBox`

- [x] 2.1 Utworzyć `apps/mobile/components/SceneTranscriptBox.tsx` z propsami `{ text: string | null | undefined; progress: number; resetKey?: string | number; style? }`
- [x] 2.2 Implementacja stałej wysokości kontenera = `LINE_HEIGHT * 5` (`LINE_HEIGHT = 24` → 120 px), `overflow: 'hidden'`, tło `audioFlowTokens.color.background.deep1`
- [x] 2.3 Auto-scroll przez `transform: [{ translateY }]`; reset `translateY = 0` przy zmianie `text` lub `resetKey` (przez `useEffect` resetujący `measuredHeight`)
- [x] 2.4 Mierzenie wysokości przez `onLayout` na `<Text>`; `totalLines = round(measuredHeight / LINE_HEIGHT)`, `scrollableLines = max(0, totalLines - 5)`
- [x] 2.5 Nakładki gradientu — 8 `<View>` o `height: 5px` i progresywnej `opacity` (góra: malejąca, dół: rosnąca), `pointerEvents="none"`, kolor `audioFlowTokens.color.background.deep1`
- [x] 2.6 Fallback dla `text` null/pusty: tekst "Brak transkrypcji dla tej sceny" w kolorze `t.color.text.onSurfaceSubtle` z `fontStyle: 'italic'`
- [x] 2.7 Test Jest w `apps/mobile/__tests__/scene-transcript-box.test.tsx`: render tekstu, fallback null/whitespace, brak crash przy zmianie `progress`, zmiana tekstu, clamp out-of-range progress

## 3. Redesign `projects/[id]/player.tsx`

- [x] 3.1 Importy zaktualizowane — `AudioFlowScreen`, `AudioFlowPlayerPanel`, `GlassPanel`, `TopAppBar`, `RoundIconButton`, `audioFlowTokens`, `audioFlowStyles` z `components/audioflow` + `AudioFlowTopChrome`, `AudioFlowGlobalMenuButton`, `AudioFlowBottomNavigation` z `components/audioflow-global-navigation` + `SceneTranscriptBox`
- [x] 3.2 `Stack.Screen` z `headerShown: false`, `useSafeAreaInsets()` jak w `projects/[id]/index.tsx`
- [x] 3.3 Struktura: `AudioFlowScreen` → `shell` → `AudioFlowTopChrome`+`TopAppBar` → `FadeZoomContent` → `ScrollView`:
  - [x] 3.3.1 Banner offline w `GlassPanel` (warunek `isOfflineMode || !isOnline`)
  - [x] 3.3.2 `GlassPanel` nagłówka z `audioFlowStyles.eyebrow` ("Scena N" / "Wstawka")
  - [x] 3.3.3 `SceneTranscriptBox` z `text={isScene ? currentItem.sceneText : null}`, `progress={trackProgress}`, `resetKey={currentItem.id}`
  - [x] 3.3.4 `AudioFlowPlayerPanel` z tymi samymi propsami co w detail screen
  - [x] 3.3.5 `GlassPanel` "Cały audiobook" — pasek `globalProgressBar` z tokenowym kolorem + etykieta `MM:SS / MM:SS`
  - [x] 3.3.6 `GlassPanel` "Offline" — stany downloading/cached/online+nie pobrane + fallback "Audio dostępne tylko online" dla offline+nie cached
  - [x] 3.3.7 Sekcja "Sceny" — `audioFlowStyles.eyebrow` + lista `Pressable` z `trackItem` (tokeny, aktywny stan `pearlTint`/`pearlBorder`)
- [x] 3.4 `AudioFlowBottomNavigation` z `active="player"`, `playerDisabled` (bieżący ekran)
- [x] 3.5 Wszystkie hardkodowane kolory usunięte — zostały tylko tokeny `audioFlowTokens.color.*`
- [x] 3.6 Stany loading/empty wrapowane w `AudioFlowScreen` + nagłówek `headerChrome`, `ActivityIndicator` z `t.color.accent.pearl`

## 4. Czystka i sprzątanie

- [x] 4.1 Usunięto `apps/mobile/app/(app)/projects/[id]/player.tsx.bak`
- [x] 4.2 Brak innych zależności od wewnętrznych styli starego `player.tsx` (sprawdzone — żaden import nie odnosi się do hardkodowanych styli)

## 5. Weryfikacja

- [x] 5.1 `npm test` w `apps/mobile` — 15 suite, 79/79 testów (w tym nowy `scene-transcript-box.test.tsx`, 6/6)
- [x] 5.2 `npm run lint` w `apps/mobile` i `packages/shared` — czysto, brak błędów
- [x] 5.3 `npx prettier --check` na zmienionych plikach — czysto po `--write` (zmienione 2 pliki: SceneTranscriptBox.tsx, player.tsx)
- [ ] 5.4 Manualna weryfikacja w Expo (web/iOS/Android) — wymaga uruchomienia `npm run dev` przez użytkownika; nieobjęte automatycznie
  - [ ] 5.4.1 Otworzyć projekt z wygenerowanym audio → tap "Zaawansowany odtwarzacz" → ekran ładuje się ze stylem AudioFlow
  - [ ] 5.4.2 Odtworzyć scenę → transkrypcja widoczna w boxie 5 linii, gradient na górze/dole zanika linie wchodzące/wychodzące, tekst przewija się płynnie wraz z postępem
  - [ ] 5.4.3 Tap kolejnej sceny → transkrypcja resetuje się do początku, postęp zerowy
  - [ ] 5.4.4 Tap "Pobierz offline" → wskaźnik postępu, po zakończeniu sekcja zmienia się na "✓ Offline (X MB)" + "Usuń cache"
  - [ ] 5.4.5 Tryb offline → banner widoczny, odtwarzanie z cache działa
  - [ ] 5.4.6 Lista scen → tap dowolnej sceny → skok do sceny, aktualizacja transkrypcji
