## Why

W modalu korekty OCR miniaturka zdjęcia jest statyczna i mała — użytkownik nie może zbliżyć widoku, aby dokładnie sprawdzić szczegóły tekstu na fotografii przed korektą. Brak zoomowania utrudnia weryfikację trudnych fragmentów OCR, szczególnie na urządzeniach mobilnych.

## What Changes

- Miniaturka zdjęcia w modalu korekty OCR (`inline-ocr-correction-modal`) zyskuje obsługę gestu pinch-to-zoom oraz opcjonalnie double-tap-to-zoom.
- Zdjęcie można powiększyć do 3× i przesuwać (pan) w stanie powiększonym.
- Dwukrotne stuknięcie resetuje zoom do 1×.
- Pozostałe elementy modalu (pole tekstowe, przycisk Zapisz) pozostają bez zmian.

## Capabilities

### New Capabilities

- `ocr-modal-image-zoom`: Zoomowanie i przesuwanie zdjęcia w modalu korekty OCR przy użyciu gestów pinch-to-zoom i double-tap.

### Modified Capabilities

- `inline-ocr-correction-modal`: Miniaturka zdjęcia zmienia się z prostego `<Image>` w interaktywny komponent z gestem zoom/pan.

## Impact

- **apps/mobile**: komponent modalny korekty OCR — dodanie obsługi gestów (`PanResponder` + `Animated` — bez `react-native-reanimated`).
- Brak zmian w API, backendzie, schemacie bazy danych, kontraktach `packages/shared`.
- Weryfikacja: testy manualne na Expo Go (iOS/Android/web); istniejące testy jednostkowe nie wymagają zmian.
