## 1. Widok zdjęć stron (`images.tsx`)

- [x] 1.1 Dodać import `audioFlowTokens`, `TopAppBar`, `GlassPanel`, `PearlButton`, `GhostButton`, `RoundIconButton` z `audioflow`
- [x] 1.2 Zastąpić `<View style={styles.header}>` komponentem `TopAppBar` z tytułem i przyciskiem powrotu (`router.back()`)
- [x] 1.3 Zamienić `StyleSheet` kart zdjęć na `GlassPanel` — usunąć `backgroundColor: '#16213e'` i `borderColor: '#0f3460'`
- [x] 1.4 Zastąpić przyciski "Galeria" i "Aparat" komponentem `GhostButton`
- [x] 1.5 Zastąpić przycisk "Dalej →" komponentem `PearlButton`
- [x] 1.6 Zastąpić przycisk "Wyślij zdjęcia" w panelu podglądu komponentem `PearlButton`
- [x] 1.7 Zastąpić panel podglądu zdjęć (`pendingPanel`) przez `GlassPanel`
- [x] 1.8 Zaktualizować kolory statusów w overlay upload: done → `softGreen`, error → `danger`, uploading → `pearl`
- [x] 1.9 Zaktualizować kolory i styl overlay drag-and-drop na `pearlBorder` / `pearl` (web only)
- [x] 1.10 Zaktualizować typografię wszystkich `Text` na fonty z `audioFlowTokens.typography.*`
- [x] 1.11 Usunąć stare `StyleSheet.create` wpisy z hardkodowanymi kolorami starej palety
- [x] 1.12 Uruchomić `npm run lint` i poprawić błędy

## 2. Widok głosu i audio (`voice.tsx`)

- [x] 2.1 Dodać import `audioFlowTokens`, `TopAppBar`, `GlassPanel`, `PearlButton`, `GhostButton`, `RoundIconButton`, `SectionHeading` z `audioflow`
- [x] 2.2 Zastąpić `<View style={styles.header}>` komponentem `TopAppBar` z tytułem "Głos i audio" i przyciskiem powrotu
- [x] 2.3 Dodać podnagłówek z językiem projektu pod `TopAppBar` lub jako komponent `SectionHeading`
- [x] 2.4 Zamienić karty głosów (`voiceCard`) na `PickerCard` — selected border na `pearlBorder`, kolor nazwy wybranego głosu na `pearl`
- [x] 2.5 Zastąpić przycisk preview głosu komponentem `RoundIconButton` (size=40)
- [x] 2.6 Zamienić `statusCard` (TTS status) na `GlassPanel` — usunąć `borderColor: '#06d6a0'`, `backgroundColor: '#073b3a'`
- [x] 2.7 Zaktualizować kolor błędu scen na `audioFlowTokens.color.accent.danger`
- [x] 2.8 Zamienić karty audio track na `GlassPanel`
- [x] 2.9 Zastąpić przycisk play/pause audio track komponentem `RoundIconButton` z `pearl` kolorem ikony
- [x] 2.10 Zastąpić przycisk "Generuj audio" w dolnym pasku komponentem `PearlButton` (z disabled state)
- [x] 2.11 Zaktualizować typografię tytułów sekcji na Quicksand SemiBold
- [x] 2.12 Usunąć stare `StyleSheet.create` wpisy z hardkodowanymi kolorami
- [x] 2.13 Uruchomić `npm run lint` i poprawić błędy

## 3. Widok udostępniania (`sharing.tsx`)

- [x] 3.1 Dodać import `audioFlowTokens`, `TopAppBar`, `GlassPanel`, `PearlButton`, `GhostButton`, `AudioFlowTextField`, `SectionHeading` z `audioflow`
- [x] 3.2 Dodać `TopAppBar` z tytułem "Udostępnij" i przyciskiem powrotu (`router.back()`)
- [x] 3.3 Zastąpić `TextInput` komponentem `AudioFlowTextField` dla pola email
- [x] 3.4 Zastąpić przycisk "Udostępnij" obok pola email komponentem `PearlButton`
- [x] 3.5 Zastąpić wpisy listy osób z dostępem (`shareItem`) komponentem `GlassPanel`
- [x] 3.6 Zaktualizować kolor przycisku "Odbierz" na `audioFlowTokens.color.accent.danger`
- [x] 3.7 Zastąpić kontener sekcji QR komponentem `GlassPanel`
- [x] 3.8 Zastąpić przycisk "Wygeneruj QR" komponentem `PearlButton`
- [x] 3.9 Zastąpić przycisk "Udostępnij link" komponentem `GhostButton`
- [x] 3.10 Zastąpić przycisk "Wygeneruj ponownie" komponentem `GhostButton` lub stylem tekstowym z `onSurfaceMuted`
- [x] 3.11 Zaktualizować tytuły sekcji na `SectionHeading` lub Quicksand SemiBold
- [x] 3.12 Zaktualizować typografię email/rola na kolory z tokenów (`onDark` / `onSurfaceMuted`)
- [x] 3.13 Usunąć stare `StyleSheet.create` wpisy z hardkodowanymi kolorami
- [x] 3.14 Uruchomić `npm run lint` i poprawić błędy

## 4. Weryfikacja

- [ ] 4.1 Uruchomić aplikację na iOS Simulator i przejść przez wszystkie trzy widoki
- [ ] 4.2 Sprawdzić poprawność back navigation z każdego widoku
- [ ] 4.3 Sprawdzić widoczność drop overlay na web (platformy web)
- [x] 4.4 Uruchomić `npm run lint` dla całego workspace
- [x] 4.5 Uruchomić `npm run test:mobile` i upewnić się, że testy przechodzą
