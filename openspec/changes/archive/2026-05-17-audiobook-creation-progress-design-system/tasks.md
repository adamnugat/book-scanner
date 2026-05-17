## 1. Wymiana stylów overlaya na tokeny AudioFlow

- [x] 1.1 W `apps/mobile/app/(app)/projects/new/images.tsx` zaimportuj `audioFlowTokens` i `GlassPanel` z `../../../../components/audioflow`
- [x] 1.2 Usuń style `processingCard` i zastąp kartę komponentem `GlassPanel` (lub równoważnymi stylami z tokenów: `t.color.surface.glass`, `t.color.surface.glassEdge`, `t.radius.panel`)
- [x] 1.3 Zmień tło `processingOverlay` z `rgba(16, 19, 32, 0.92)` na `rgba(19, 19, 22, 0.94)` zgodne z paletą `AudioFlowScreen`
- [x] 1.4 Zmień kolor spinnera z `#06d6a0` na `t.color.accent.pearlBright` (`#FBFCF8`)
- [x] 1.5 Zastąp style `processingTitle` stylem `audioFlowStyles.headlineMd` (Quicksand SemiBold, 24px)
- [x] 1.6 Zastąp style `processingSubtitle` stylem `audioFlowStyles.body` (Varela Round, 16px, `t.color.text.onSurfaceSubtle`)

## 2. Dodanie osi czasu 3 etapów

- [x] 2.1 Zdefiniuj stałą tablicę kroków `PROCESSING_STEPS` z etapami `uploading`, `ocr`, `audio` i ich polskimi etykietami
- [x] 2.2 Dodaj helper/komponent `ProcessingTimeline` (inline w `images.tsx`) renderujący pionową listę kroków
- [x] 2.3 Dla każdego kroku: ukończony → ikona ✓ w `t.color.accent.pearl`; aktywny → `ActivityIndicator` w `pearlBright`; oczekujący → ikona ○ w `t.color.text.onSurfaceMuted`
- [x] 2.4 Etykiety kroków: ukończony i aktywny w `t.color.text.onDark`, oczekujący w `t.color.text.onSurfaceMuted`
- [x] 2.5 Dodaj pionowy separator (borderLeft lub View) w kolorze `t.color.surface.glassEdge` łączący kroki
- [x] 2.6 Dodaj `accessibilityLabel` do każdego kroku opisujący stan (np. `"Wgrywanie zdjęć — ukończone"`)

## 3. Weryfikacja

- [x] 3.1 Uruchom `npm run test:mobile` i upewnij się, że testy nakładki progresu przechodzą (jeśli istnieją) lub nie zostały zepsute
- [x] 3.2 Uruchom `npm run lint` i popraw ewentualne błędy lint
- [ ] 3.3 Ręcznie zweryfikuj overlay na symulatorze iOS lub Android przechodząc tryb automatyczny kreatora
