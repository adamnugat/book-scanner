# Zadania: Ujednolicone dolne menu na ekranie zdjęć stron

## apps/mobile — components

- [x] **T1** `audioflow.tsx`: Dodaj opcjonalne propsy do `AudioFlowFooterMenu`:
  - `leftIcon?: Feather name` (default `'grid'`)
  - `leftLabel?: string` (default `'Biblioteka'`)
  - `leftDisabled?: boolean` (default `false`)
  - `rightIcon?: Feather name` (default `'headphones'`)
  - `rightLabel?: string` (default `'Odtwarzacz'`)
  - `rightDisabled?: boolean` (nowy alias — zastępuje lub uzupełnia `playerDisabled`)
  - Użyj wartości domyślnych — żaden istniejący callsite nie wymaga zmian
  - Podmień hardkodowane `'grid'`/`'Biblioteka'` i `'headphones'`/`'Odtwarzacz'` na te propsy

## apps/mobile — ekran zdjęć stron

- [x] **T2** `[id]/images.tsx`: Dodaj `import { useSafeAreaInsets } from 'react-native-safe-area-context'` i `const insets = useSafeAreaInsets()` w komponencie

- [x] **T3** `[id]/images.tsx`: Dodaj `import { AudioFlowFooterMenu } from '../../../../components/audioflow'` (lub dołącz do istniejącego importu z audioflow)

- [x] **T4** `[id]/images.tsx`: Dodaj stan `const [hasChanges, setHasChanges] = useState(false)`

- [x] **T5** `[id]/images.tsx`: Ustaw `hasChanges = true` przy każdej mutacji:
  - po `pickFromGallery` gdy wybrano zdjęcia (`assets.length > 0`)
  - po `takePhoto` gdy wykonano zdjęcie
  - po `deleteImage` (usunięcie zdjęcia)
  - po `reorderImage` / wywołaniu API zmiany kolejności

- [x] **T6** `[id]/images.tsx`: Dodaj `handleSaveChanges`:
  - jeśli `pendingAssets.length > 0` → wywołaj istniejący flow uploadu (już jest w pliku), po zakończeniu `setHasChanges(false)`
  - jeśli brak pending ale `hasChanges` → `showToast('Zmiany zapisane')`, `setHasChanges(false)`

- [x] **T7** `[id]/images.tsx`: Zastąp `<View style={styles.bottomBar}>...</View>` przez `<AudioFlowFooterMenu>` z props:
  - `bottomInset={insets.bottom}`
  - `leftIcon="image"` / `leftLabel="Galeria"` / `onLibraryPress={pickFromGallery}`
  - `createIcon="check"` / `createLabel="Zapisz zmiany"` / `createDisabled={!hasChanges}` / `onCreatePress={handleSaveChanges}`
  - `rightIcon="camera"` / `rightLabel="Aparat"` / `rightDisabled={Platform.OS === 'web'}` / `onPlayerPress={takePhoto}`

- [x] **T8** `[id]/images.tsx`: Usuń nieużywane style `bottomBar`, `bottomBtn` i nieużywane importy (`GhostButton`, `PearlButton` jeśli nie używane gdzie indziej)

## Weryfikacja

- [x] **T9** `npm run lint` — brak błędów ESLint (TypeScript clean; ESLint config error pre-existing Node version issue)
- [ ] `npm run test:mobile` — brak regresji
- [ ] Ręczny test na iOS/Android: lewy przycisk otwiera galerię, prawy aparat, środkowy nieaktywny na starcie; po dodaniu zdjęcia środkowy aktywny
- [ ] Ręczny test web: prawy przycisk (aparat) niewidoczny lub nieaktywny
