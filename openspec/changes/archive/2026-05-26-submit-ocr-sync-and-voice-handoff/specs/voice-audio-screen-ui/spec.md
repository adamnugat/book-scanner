## ADDED Requirements

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
