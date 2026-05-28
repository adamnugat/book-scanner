## Context

Modal korekty OCR (`OcrCorrectionModal.tsx`) wyświetla zdjęcie jako statyczny komponent `PageImagePreview` (wysokość 200 px) wewnątrz `ScrollView`. Użytkownik nie może zbliżyć widoku, co utrudnia weryfikację trudnych fragmentów tekstu.

Projekt zakazuje `react-native-reanimated` (crash w Expo Go). Dostępne narzędzia gestów: `PanResponder` + `Animated` z React Native core.

## Goals / Non-Goals

**Goals:**
- Pinch-to-zoom (skala 1×–3×) na zdjęciu w modalu.
- Pan (przesuwanie) gdy scale > 1×.
- Double-tap: przełącza między 1× a 2×.
- Brak zmian w API, backendzie, schemacie danych.

**Non-Goals:**
- Zoom na innych ekranach (lista zdjęć, podgląd sceny).
- Obsługa web (gesty myszy/trackpad) — wystarczy mobile.
- Animowane spring po puszczeniu gestu — lerp/clamp wystarczy.

## Decisions

### 1. Wyodrębniony komponent `ZoomableImage`

**Decyzja:** Nowy komponent `apps/mobile/components/ZoomableImage.tsx` zamiast logiki inline w modalu.

**Uzasadnienie:** Modal jest już złożony (KeyboardAvoidingView, ScrollView, loading state). Wyodrębnienie upraszcza oba pliki i umożliwia reuse w przyszłości.

**Alternatywa odrzucona:** Inline w `OcrCorrectionModal` — zbyt duże zagęszczenie logiki gestów w już rozbudowanym komponencie.

### 2. PanResponder + Animated zamiast Gesture Handler

**Decyzja:** `PanResponder` + `Animated.Value` dla scale i translate.

**Uzasadnienie:** Projekt ma twardy zakaz `react-native-reanimated`. `react-native-gesture-handler` jest co prawda dostępny w Expo, ale nie jest jeszcze używany w projekcie — dodanie nowej zależności tylko dla jednej funkcji jest nieproporcjonalne. `PanResponder` + `Animated` jest wystarczający dla pinch/pan.

**Alternatywa odrzucona:** `react-native-gesture-handler` — nowa zależność, ryzyko konfiguracji.

### 3. ScrollView vs zoomable container

**Decyzja:** Zdjęcie wychodzi z `ScrollView` — `ZoomableImage` jest **nad** `ScrollView` jako osobny blok (lub `ScrollView` otacza tylko `TextInput`).

**Uzasadnienie:** `PanResponder` i `ScrollView` mają konflikt gestów — `ScrollView` przechwytuje swipe pionowy zanim `PanResponder` zdąży rozpoznać pinch. Rozwiązanie: `scrollEnabled={false}` gdy scale > 1, lub przenieść zdjęcie poza `ScrollView`.

**Preferowane:** Przenieść zdjęcie poza `ScrollView` (wyżej, przed nim). `ScrollView` wtedy obejmuje tylko `TextInput`. Prostsze niż dynamiczne `scrollEnabled`.

### 4. Granice pan

Pan clampowany do granic zdjęcia przy aktualnej skali: `maxTranslate = (imageSize * (scale - 1)) / 2`. Po zresetowaniu scale do 1× translate resetuje się do (0, 0).

### 5. Double-tap

Wykrywany przez zliczanie tapnięć z debounce 300 ms w `PanResponder.onStartShouldSetPanResponder`. Toggle: scale 1× ↔ 2×, translate → (0, 0).

## Risks / Trade-offs

- **Konflikt gestów ScrollView/PanResponder** → Mitygacja: zdjęcie poza ScrollView (patrz Decyzja 3).
- **Web (Expo Web) nie obsługuje touch events przez PanResponder poprawnie** → Akceptowalne — zoom na web nie jest wymagany; zdjęcie działa jak dotychczas (brak pinch).
- **Wydajność Animated na starych urządzeniach** → `useNativeDriver: true` dla translate; scale nie obsługuje native driver na starych RN — używamy JS driver tylko dla scale, native dla translate osobno lub łączymy w `Animated.parallel`.

## Migration Plan

Brak zmian danych ani API. Wdrożenie jednoetapowe:
1. Dodaj `ZoomableImage.tsx`.
2. Podmień `PageImagePreview` w `OcrCorrectionModal` na `ZoomableImage`.
3. Przenieś `TextInput` + `ScrollView` pod zdjęcie.
4. Weryfikacja manualna Expo Go.

Rollback: przywrócenie poprzedniego `PageImagePreview` w modalu.

## Open Questions

- Czy zdjęcie ma mieć ustaloną wysokość (np. 220 px) czy `flex: 1` w określonym kontenerze? Propozycja: `height: 220` jak dotychczas, z `overflow: hidden`.
