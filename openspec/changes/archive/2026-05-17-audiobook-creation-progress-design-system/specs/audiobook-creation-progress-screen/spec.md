## ADDED Requirements

### Requirement: Progress overlay uses AudioFlow design tokens

Nakładka progresu kreatora automatycznego SHALL używać tokenów `audioFlowTokens` i komponentu `GlassPanel` zamiast hardkodowanych wartości kolorów i stylu.

#### Scenario: Overlay renders with glass surface

- **WHEN** tryb automatyczny przetwarza zdjęcia (stan `uploading`, `ocr` lub `audio`)
- **THEN** nakładka SHALL wyświetlać kartę z tłem `t.color.surface.glass`, obramowaniem `t.color.surface.glassEdge` i zaokrągleniem `t.radius.panel` (24px)

#### Scenario: Overlay uses pearl accent color

- **WHEN** spinner aktywnego etapu jest widoczny
- **THEN** kolor spinnera SHALL być `t.color.accent.pearl` (`#F0EAD6`) lub `t.color.accent.pearlBright` (`#FBFCF8`)

#### Scenario: Overlay uses AudioFlow typography

- **WHEN** tytuł aktywnego etapu jest wyświetlany
- **THEN** SHALL używać stylu `audioFlowStyles.headlineMd` (Quicksand SemiBold, 24px)
- **AND** opis etapu SHALL używać stylu `audioFlowStyles.body` (Varela Round, 16px, `t.color.text.onSurfaceSubtle`)

#### Scenario: Overlay background matches screen palette

- **WHEN** nakładka jest widoczna
- **THEN** tło nakładki SHALL mieć odcień ciemny wine/dark zgodny z `AudioFlowScreen` (bazowy kolor `#131316` z opacity ≥ 0.92), bez niebieskawego odcienia

### Requirement: Progress overlay shows 3-step timeline

Nakładka progresu SHALL wyświetlać jednocześnie wszystkie 3 etapy przetwarzania jako pionową oś czasu, aby użytkownik rozumiał postęp całości.

#### Scenario: All three steps visible at once

- **WHEN** nakładka progresu jest wyświetlana w dowolnym stanie (`uploading`, `ocr`, `audio`)
- **THEN** widoczne SHALL być wszystkie 3 etapy: "Wgrywanie zdjęć", "Rozpoznawanie tekstu", "Generowanie audio"

#### Scenario: Completed step shows checkmark

- **WHEN** etap został zakończony (np. `uploading` gdy stan to `ocr`)
- **THEN** etap SHALL być oznaczony ikoną ukończenia (✓) w kolorze `t.color.accent.pearl`
- **AND** etykieta etapu SHALL być w kolorze `t.color.text.onDark`

#### Scenario: Active step shows spinner

- **WHEN** etap jest aktualnie przetwarzany
- **THEN** SHALL wyświetlać `ActivityIndicator` w kolorze pearl (`t.color.accent.pearl` lub `pearlBright`)
- **AND** etykieta SHALL być wyróżniona (pełny biały, `t.color.text.onDark`)

#### Scenario: Pending step is visually muted

- **WHEN** etap jeszcze nie rozpoczął się
- **THEN** ikonka i etykieta SHALL być w kolorze `t.color.text.onSurfaceMuted` (60% opacity white)

#### Scenario: Steps are connected visually

- **WHEN** oś czasu jest wyświetlana
- **THEN** kroki SHALL być połączone pionową linią separatora w kolorze `t.color.surface.glassEdge`
