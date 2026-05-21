## ADDED Requirements

### Requirement: Spójna stylistyka z ekranem szczegółów projektu
Ekran zaawansowanego odtwarzacza (`projects/[id]/player.tsx`) MUST używać tych samych komponentów AudioFlow co ekran szczegółów projektu: `AudioFlowScreen`, `AudioFlowTopChrome`, `TopAppBar`, `RoundIconButton`, `AudioFlowPlayerPanel`, `GlassPanel`, `AudioFlowBottomNavigation`, oraz tokenów `audioFlowTokens` i stylów `audioFlowStyles`.

#### Scenario: Otwarcie zaawansowanego odtwarzacza z ekranu szczegółów
- **WHEN** użytkownik na ekranie szczegółów projektu z wygenerowanym audio tapnie "Zaawansowany odtwarzacz"
- **THEN** system SHALL otworzyć ekran `projects/[id]/player.tsx` ze stylem identycznym z ekranem szczegółów: ten sam top bar, ta sama paleta tokenów, ten sam `AudioFlowPlayerPanel` z paskiem postępu, kontrolkami transportu i przyciskami skip ±10s

#### Scenario: Brak hardkodowanych kolorów
- **WHEN** developer przegląda `apps/mobile/app/(app)/projects/[id]/player.tsx`
- **THEN** plik SHALL NOT zawierać hardkodowanych literałów kolorów (`#e94560`, `#16213e`, `#0f3460`, `#06d6a0`, `#888`, `#666`, `#0e0e0e`, etc.) — wszystkie kolory MUST pochodzić z `audioFlowTokens.color.*`

---

### Requirement: Box transkrypcji bieżącej sceny — 5 linii z gradientową maską
Ekran zaawansowanego odtwarzacza SHALL wyświetlać komponent `SceneTranscriptBox` pokazujący tekst (`sceneText`) aktualnie odtwarzanej sceny w kontenerze mieszczącym dokładnie 5 linii tekstu, z gradientową maską opacity na górze i na dole.

#### Scenario: Render transkrypcji dla sceny z tekstem
- **WHEN** użytkownik odtwarza scenę z niepustym `sceneText`
- **THEN** `SceneTranscriptBox` SHALL renderować tekst sceny w kontenerze o wysokości `LINE_HEIGHT * 5` z `overflow: hidden`
- **AND** SHALL nakładać `LinearGradient` na górze (z koloru tła do `transparent`) i na dole (z `transparent` do koloru tła), `pointerEvents="none"`

#### Scenario: Fallback dla sceny bez transkrypcji
- **WHEN** bieżący element playlisty jest interstitial (`type !== 'scene'`) lub `sceneText` jest `null`/pusty
- **THEN** `SceneTranscriptBox` SHALL renderować tekst placeholder "Brak transkrypcji dla tej sceny" w kolorze `audioFlowTokens.color.text.onSurfaceSubtle`

#### Scenario: Krótki tekst mieszczący się w 5 liniach
- **WHEN** zmierzona wysokość tekstu jest mniejsza lub równa `LINE_HEIGHT * 5`
- **THEN** `SceneTranscriptBox` SHALL NOT przewijać tekstu (`translateY = 0`)
- **AND** gradient mask SHALL pozostać widoczny dla spójności wizualnej

---

### Requirement: Auto-scroll transkrypcji proporcjonalny do postępu sceny
`SceneTranscriptBox` SHALL przewijać tekst transkrypcji liniowo w pionie w funkcji postępu odtwarzania bieżącej sceny (`positionMs / durationMs`), bez wykorzystywania per-word/per-line timestampów.

#### Scenario: Przewijanie podczas odtwarzania
- **WHEN** scena jest odtwarzana, `positionMs` rośnie od 0 do `durationMs`, a transkrypcja zawiera więcej niż 5 linii
- **THEN** wewnętrzny kontener `<Text>` SHALL być przesunięty `translateY = -scrollableLines * LINE_HEIGHT * (positionMs / durationMs)`, gdzie `scrollableLines = max(0, totalLines - 5)`
- **AND** linie wchodzące od dołu i wychodzące u góry SHALL pojawiać się i zanikać przez gradient mask

#### Scenario: Reset przy zmianie sceny
- **WHEN** użytkownik skoczy do innej sceny (`jumpToScene` lub `goToSceneIndex`) lub scena zmieni się automatycznie po zakończeniu poprzedniej
- **THEN** `SceneTranscriptBox` SHALL zresetować `translateY` do 0 i ponownie zmierzyć wysokość nowego tekstu (`measuredHeight` reset do 0, `onLayout` ustawia nową wartość)

#### Scenario: Pauza odtwarzania
- **WHEN** użytkownik wstrzyma odtwarzanie
- **THEN** `translateY` SHALL pozostać na bieżącej wartości (postęp nie zmienia się), transkrypcja zatrzymuje się w miejscu

---

### Requirement: Informacje o scenie i lista scen
Ekran zaawansowanego odtwarzacza SHALL wyświetlać informacje o aktualnie odtwarzanej scenie (etykieta "Scena N" lub "Wstawka") oraz listę wszystkich scen w playlist z możliwością skoku.

#### Scenario: Etykieta bieżącej sceny
- **WHEN** bieżący element playlisty ma `type === 'scene'`
- **THEN** ekran SHALL wyświetlać `audioFlowStyles.eyebrow` z tekstem `Scena ${(currentItem.sceneOrderIndex ?? 0) + 1}`

#### Scenario: Etykieta dla wstawki
- **WHEN** bieżący element playlisty ma `type !== 'scene'` (interstitial / jingle)
- **THEN** ekran SHALL wyświetlać `audioFlowStyles.eyebrow` z tekstem `Wstawka`

#### Scenario: Lista scen z aktywnym stanem
- **WHEN** ekran jest wyrenderowany z `playlist` zawierającą sceny
- **THEN** ekran SHALL wyświetlać listę scen (filtrowaną do `type === 'scene'`) z numerem `(sceneOrderIndex + 1)`, fragmentem `sceneText` i czasem trwania
- **AND** bieżąca scena (`currentItem?.referenceId === item.referenceId`) SHALL mieć aktywne wyróżnienie (np. obramowanie `audioFlowTokens.color.accent.pearl` lub równoważne)

#### Scenario: Skok do sceny przez tap
- **WHEN** użytkownik tapnie element listy scen
- **THEN** system SHALL wywołać `jumpToScene(item.sceneOrderIndex ?? 0)` z hooka `useAudioPlayer`
- **AND** odtwarzanie SHALL przeskoczyć do wybranej sceny od pozycji 0
- **AND** `SceneTranscriptBox` SHALL zresetować się i pokazać tekst nowej sceny

---

### Requirement: Sekcja pobierania offline
Ekran zaawansowanego odtwarzacza SHALL eksponować sekcję pobierania offline z trzema stanami: nie pobrane (online + przycisk), w trakcie pobierania (progress), pobrane (info + usuń cache).

#### Scenario: Stan nie pobrane — online
- **WHEN** `!isCached && !downloading && isOnline`
- **THEN** sekcja SHALL renderować `Pressable` z etykietą "Pobierz offline"
- **AND** tap SHALL wywołać `handleDownloadOffline()` z hooka `useAudioPlayer`

#### Scenario: Stan pobierania w toku
- **WHEN** `downloading === true`
- **THEN** sekcja SHALL renderować wskaźnik postępu z tekstem `Pobieranie: ${downloadProgress.done}/${downloadProgress.total}`

#### Scenario: Stan pobrane
- **WHEN** `isCached === true`
- **THEN** sekcja SHALL renderować tekst `✓ Offline (X.X MB)` (gdzie `X.X = (cacheSize / 1024 / 1024).toFixed(1)`)
- **AND** SHALL renderować `Pressable` "Usuń cache" wywołujący `handleDeleteCache()`

#### Scenario: Stan nie pobrane — offline
- **WHEN** `!isCached && !downloading && !isOnline`
- **THEN** sekcja SHALL ukryć przycisk pobierania (brak akcji możliwej offline bez cache)

---

### Requirement: Banner trybu offline
Ekran zaawansowanego odtwarzacza SHALL wyświetlać banner informacyjny gdy aktywny jest tryb offline (`isOfflineMode`) lub brak połączenia (`!isOnline`).

#### Scenario: Banner przy odtwarzaniu z cache
- **WHEN** `isOfflineMode === true`
- **THEN** ekran SHALL wyświetlać banner z tekstem `📴 Odtwarzanie z cache (offline)` w stylu opartym o `audioFlowTokens` (np. `GlassPanel` z akcentem `t.color.warning` lub analogiczny)

#### Scenario: Banner przy braku połączenia bez cache
- **WHEN** `!isOnline && !isOfflineMode`
- **THEN** ekran SHALL wyświetlać banner z tekstem `📴 Brak połączenia`

#### Scenario: Brak bannera przy normalnym połączeniu
- **WHEN** `isOnline === true && isOfflineMode === false`
- **THEN** ekran SHALL NOT renderować bannera

---

### Requirement: Stany ładowania i pusty
Ekran zaawansowanego odtwarzacza SHALL obsługiwać stan ładowania playlisty i stan pustej playlisty w stylu AudioFlow.

#### Scenario: Stan loading
- **WHEN** `loading === true`
- **THEN** ekran SHALL renderować `AudioFlowScreen` z `<ActivityIndicator>` wycentrowanym i kolorem `audioFlowTokens.color.accent.*` (zamiast hardkodowanego `#e94560`)

#### Scenario: Stan empty
- **WHEN** `loading === false && playlist.length === 0`
- **THEN** ekran SHALL renderować `AudioFlowScreen` z tekstem `Brak audio. Wygeneruj audio ze scen.` w kolorze `audioFlowTokens.color.text.onSurfaceSubtle`
