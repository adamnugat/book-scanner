## 1. Komponent ZoomableImage

- [x] 1.1 Utwórz `apps/mobile/components/ZoomableImage.tsx` z propsami: `uri: string | null`, `style?: ViewStyle`, `resizeMode?: ImageResizeMode`
- [x] 1.2 Zaimplementuj `Animated.Value` dla `scale` (init 1), `translateX` (init 0), `translateY` (init 0)
- [x] 1.3 Zaimplementuj logikę pinch-to-zoom przez `PanResponder` — wykrywanie dwóch dotyków, obliczanie odległości palców, aktualizacja `scale` w zakresie 1×–3×
- [x] 1.4 Zaimplementuj pan (przesuwanie) gdy scale > 1× — clamp translate do granic `(imageSize * (scale-1)) / 2`
- [x] 1.5 Zaimplementuj double-tap (debounce 300 ms) — toggle scale 1× ↔ 2× z resetem translate do (0, 0)
- [x] 1.6 Upewnij się że `overflow: 'hidden'` na kontenerze ogranicza widoczność powiększonego obrazu

## 2. Integracja z OcrCorrectionModal

- [x] 2.1 W `OcrCorrectionModal.tsx` przenieś `ZoomableImage` poza `ScrollView` — `ScrollView` obejmuje tylko `TextInput`
- [x] 2.2 Zastąp `PageImagePreview` komponentem `ZoomableImage` — przekaż `imageUrl ?? thumbnailUrl` jako `uri`
- [x] 2.3 Zachowaj styl kontenera zdjęcia: `width: '100%'`, `height: 220`, `borderRadius`, `marginBottom: 12`
- [x] 2.4 Zresetuj stan zoom (`scale`, `translate`) po zamknięciu i ponownym otwarciu modalu (effect na `visible`)

## 3. Weryfikacja

- [x] 3.1 Uruchom `npm run lint` — brak błędów w `apps/mobile`
- [x] 3.2 Uruchom `npm run test:mobile` — istniejące testy OCR modal przechodzą
- [ ] 3.3 Przetestuj manualnie w Expo Go: pinch-zoom, pan, double-tap, edycja tekstu po zoom
- [ ] 3.4 Sprawdź że ScrollView z `TextInput` nie przechwytuje gestu pinch na zdjęciu
