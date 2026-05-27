## ADDED Requirements

### Requirement: Ekran używa AudioFlow design system
Ekran głosu i audio (`voice.tsx`) SHALL używać wyłącznie tokenów z `audioFlowTokens` dla kolorów, typografii, odstępów i promieni. Niedozwolone jest użycie hardkodowanych wartości z starej palety (`#16213e`, `#0f3460`, `#073b3a`, `#06d6a0`, `#e94560`).

#### Scenario: Tło ekranu
- **WHEN** użytkownik otwiera widok głosu i audio
- **THEN** tło ekranu MUSI być tłem `AudioFlowScreen` z `audioFlowTokens.color.background.*`

### Requirement: Nagłówek z przyciskiem powrotu
Ekran SHALL wyświetlać `TopAppBar` z tytułem "Głos i audio" i przyciskiem powrotu po lewej stronie. Podnagłówek z językiem projektu MUSI być wyświetlony pod `TopAppBar` lub jako `subtitle` jeśli `TopAppBar` to obsługuje.

#### Scenario: Przycisk powrotu
- **WHEN** użytkownik tapnie przycisk powrotu
- **THEN** aplikacja MUSI wrócić do poprzedniego ekranu przez `router.back()`

### Requirement: Karty głosów używają `GlassPanel`
Karty wyboru głosu SHALL używać `GlassPanel` zamiast `backgroundColor: '#16213e'`. Karta wybranego głosu SHALL sygnalizować selekcję przez `pearlBorder` jako borderColor zamiast `#e94560`.

#### Scenario: Karta niewybranego głosu
- **WHEN** karta głosu nie jest wybrana
- **THEN** MUSI mieć tło `GlassPanel` i borderColor `audioFlowTokens.color.surface.glassEdge`

#### Scenario: Karta wybranego głosu
- **WHEN** karta głosu jest aktywnie wybrana
- **THEN** MUSI mieć borderColor `audioFlowTokens.color.accent.pearlBorder` i nazwa głosu MUSI być w kolorze `audioFlowTokens.color.accent.pearl`

#### Scenario: Ikona checkmark selekcji
- **WHEN** głos jest wybrany
- **THEN** ikona "✓" MUSI być w kolorze `audioFlowTokens.color.accent.pearl`

### Requirement: Przycisk play/preview głosu używa `RoundIconButton`
Przycisk podglądu próbki głosu (`▶/⏸`) SHALL używać `RoundIconButton` (size=40) zamiast `Pressable` z `backgroundColor: '#0f3460'`.

#### Scenario: Przycisk preview
- **WHEN** głos ma `previewUrl`
- **THEN** przycisk MUSI być `RoundIconButton` z ikoną `▶` lub `⏸`

### Requirement: Sekcja statusu TTS używa `GlassPanel`
Karta statusu TTS (`statusCard`) SHALL używać `GlassPanel` zamiast `backgroundColor: '#073b3a'` z `borderColor: '#06d6a0'`. Wartości liczników scen MUSZĄ używać kolorów z `audioFlowTokens`.

#### Scenario: Karta statusu TTS
- **WHEN** sekcja TTS jest widoczna
- **THEN** karta MUSI być owrapowana w `GlassPanel`

#### Scenario: Kolor licznika scen z błędem
- **WHEN** `erroredSceneCount > 0`
- **THEN** tekst błędu MUSI używać `audioFlowTokens.color.accent.danger`

### Requirement: Karty audio track używają `GlassPanel` i `RoundIconButton`
Karty wygenerowanych ścieżek audio SHALL używać `GlassPanel`. Przycisk play/pause SHALL używać `RoundIconButton`.

#### Scenario: Przycisk play audio track
- **WHEN** karta audio track jest widoczna
- **THEN** przycisk `▶/⏸` MUSI być `RoundIconButton` z kolorem ikony `audioFlowTokens.color.accent.pearl`

### Requirement: Przycisk "Generuj audio" używa `PearlButton`
Przycisk "Generuj audio" w dolnym pasku SHALL używać `PearlButton` zamiast `Pressable` z `backgroundColor: '#e94560'`. Stan wyłączony MUSI być wizualnie różny przez zmniejszoną opacity.

#### Scenario: Stan aktywny
- **WHEN** `canGenerate === true`
- **THEN** przycisk MUSI być `PearlButton` z pełną opacity

#### Scenario: Stan wyłączony
- **WHEN** `canGenerate === false`
- **THEN** `PearlButton` MUSI mieć opacity zmniejszone (disabled prop lub styl)

### Requirement: Typografia zgodna z AudioFlow
Tytuły sekcji SHALL używać Quicksand Bold, treść i meta SHALL używać Varela Round.

#### Scenario: Tytuł sekcji
- **WHEN** sekcja "Głos lektora" lub "Text to Speech" jest widoczna
- **THEN** tytuł MUSI mieć `fontFamily: 'Quicksand_600SemiBold'`

#### Scenario: Nazwa głosu
- **WHEN** karta głosu jest widoczna
- **THEN** nazwa głosu MUSI mieć `fontFamily: 'Quicksand_600SemiBold'` lub `Varela Round` dla body

### Requirement: Ekran głosu przyjmuje listę nowo zsynchronizowanych scen z parametrów routingu

`apps/mobile/app/(app)/projects/[id]/voice.tsx` SHALL czytać opcjonalny parametr routingu `newSceneIds` (string CSV identyfikatorów scen) z `useLocalSearchParams`. Parametr MUST być traktowany jako lista scen utworzonych podczas ostatniego submitu, propagowana z ekranu „Sceny OCR" (krok korekty) przez przycisk przejścia do Głosu Lektora. Brak parametru lub pusty ciąg MUST oznaczać brak nowych scen do wyróżnienia (zachowanie identyczne z dzisiejszym).

#### Scenario: Parametr newSceneIds jest poprawnie parsowany

- **WHEN** ekran głosu zostaje otwarty z `params.newSceneIds = 'sceneA,sceneB'`
- **THEN** komponent MUST utworzyć `Set<string>` zawierający `'sceneA'` i `'sceneB'`
- **AND** każda scena z `sceneId` w tym secie MUST być traktowana jako „nowa"

#### Scenario: Brak parametru newSceneIds

- **WHEN** ekran głosu zostaje otwarty bez `params.newSceneIds`
- **THEN** żadna scena MUST NOT być oznaczona jako „nowa"
- **AND** UI MUST renderować się jak dotychczas

### Requirement: Nowe sceny są wizualnie wyróżnione i mają komunikat zachęcający do TTS

Sekcja statusu TTS (`GlassPanel` z nagłówkiem „Text to Speech") SHALL wyświetlać dedykowaną linię z liczbą nowych scen, gdy `newSceneIds.size > 0`. Liczba nowych scen MUST być wyróżniona kolorem `audioFlowTokens.color.accent.pearl`. Komunikat „Możesz uruchomić TTS dla nowych zdjęć" MUST być wyświetlony pod liczbą nowych scen, jeśli przycisk „Generuj audio" jest aktywny (czyli `canGenerate === true`).

#### Scenario: Wyświetlenie licznika nowych scen

- **WHEN** ekran głosu zostaje otwarty z `newSceneIds.size > 0`
- **THEN** sekcja TTS MUST wyświetlać linię „Nowe zdjęcia gotowe do TTS: N" w kolorze `accent.pearl`

#### Scenario: Brak licznika nowych scen

- **WHEN** ekran głosu zostaje otwarty z pustą listą `newSceneIds`
- **THEN** sekcja TTS MUST NOT wyświetlać linii „Nowe zdjęcia gotowe do TTS"

#### Scenario: Komunikat zachęcający do TTS

- **WHEN** `newSceneIds.size > 0` i `canGenerate === true`
- **THEN** poniżej licznika nowych scen MUST być widoczny tekst „Możesz uruchomić TTS dla nowych zdjęć" w kolorze `text.onSurfaceMuted`

#### Scenario: Komunikat ukryty, gdy TTS niedostępne

- **WHEN** `newSceneIds.size > 0` ale `canGenerate === false` (np. brak wybranego głosu)
- **THEN** komunikat „Możesz uruchomić TTS dla nowych zdjęć" MUST NOT być wyświetlony
- **AND** zachowane są dotychczasowe komunikaty hint (np. „Najpierw wybierz głos")
