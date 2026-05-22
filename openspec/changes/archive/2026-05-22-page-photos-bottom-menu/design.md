# Design: Ujednolicone dolne menu na ekranie zdjęć stron

## Przegląd

Rozszerzamy `AudioFlowFooterMenu` o opcjonalne propsy dla ikon i etykiet lewego i prawego przycisku, a następnie podmieniamy stary `bottomBar` w `[id]/images.tsx` na ten komponent.

## Zmiany w `audioflow.tsx`

### Nowe propsy `AudioFlowFooterMenu`

```ts
leftIcon?: React.ComponentProps<typeof Feather>['name'];   // default: 'grid'
leftLabel?: string;                                         // default: 'Biblioteka'
leftDisabled?: boolean;                                     // default: false
rightIcon?: React.ComponentProps<typeof Feather>['name'];  // default: 'headphones'
rightLabel?: string;                                        // default: 'Odtwarzacz'
```

Propsy `playerDisabled` i `rightDisabled` są traktowane równoważnie — `rightDisabled` to alias lub `playerDisabled` zostaje rozszerzony (preferuj zmianę nazwy na `rightDisabled` dla spójności; jeśli to breaking change, dodaj `rightDisabled` obok `playerDisabled`).

Wartości domyślne zachowują pełną kompatybilność wsteczną — żaden istniejący callsite nie wymaga zmian.

## Zmiany w `[id]/images.tsx`

### Stan `hasChanges`

Dodajemy `const [hasChanges, setHasChanges] = useState(false)`.

`hasChanges` ustawiane na `true` gdy:
- użytkownik wybierze zdjęcia z galerii (`pickFromGallery` → `setPendingAssets`)
- użytkownik zrobi zdjęcie aparatem (`takePhoto` → `setPendingAssets`)
- użytkownik usunie zdjęcie (`deleteImage`)
- użytkownik zmieni kolejność zdjęcia (`reorderImage`)

`hasChanges` resetowane na `false` po pomyślnym wysłaniu/zapisaniu zmian.

### Zastąpienie `bottomBar`

Zamiast:
```tsx
<View style={styles.bottomBar}>
  <GhostButton label="Galeria" onPress={pickFromGallery} style={styles.bottomBtn} />
  {Platform.OS !== 'web' && (
    <GhostButton label="Aparat" onPress={takePhoto} style={styles.bottomBtn} />
  )}
  {images.length > 0 && (
    <PearlButton label="Dalej →" onPress={...} style={styles.bottomBtn} />
  )}
</View>
```

Używamy:
```tsx
<AudioFlowFooterMenu
  bottomInset={insets.bottom}
  leftIcon="image"
  leftLabel="Galeria"
  onLibraryPress={pickFromGallery}
  createIcon="check"
  createLabel="Zapisz zmiany"
  createDisabled={!hasChanges}
  onCreatePress={handleSaveChanges}
  rightIcon="camera"
  rightLabel="Aparat"
  rightDisabled={Platform.OS === 'web'}
  onPlayerPress={takePhoto}
/>
```

### `handleSaveChanges`

Jeśli są `pendingAssets` → wywołuje istniejący flow uploadu.
Jeśli nie ma pendingAssets ale są inne zmiany (kolejność, usunięcia) → `showToast` potwierdzający zapis, reset `hasChanges`.

### Import `useSafeAreaInsets`

Dodajemy `import { useSafeAreaInsets } from 'react-native-safe-area-context'` (już używany w `new/images.tsx`).

## Impakty

| Obszar | Wpływ |
|---|---|
| API/backend | brak |
| Prisma/DB | brak |
| Shared package | brak |
| Offline cache | brak |
| Nawigacja | brak — router.push do text-regions usuwamy z tego widoku (był `images.length > 0 && "Dalej →"`) |
| Kompatybilność wsteczna | pełna — nowe propsy są opcjonalne |

## Uwagi

- Na web `rightDisabled={Platform.OS === 'web'}` zachowuje istniejące zachowanie (aparat niedostępny na web).
- Stare style `bottomBar`, `bottomBtn` można usunąć po podmianie.
- `GhostButton` i `PearlButton` nie muszą być już importowane jeśli nie są używane gdzie indziej w pliku.
