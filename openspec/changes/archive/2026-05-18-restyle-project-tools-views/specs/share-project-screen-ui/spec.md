## ADDED Requirements

### Requirement: Ekran używa AudioFlow design system
Ekran udostępniania (`sharing.tsx`) SHALL używać wyłącznie tokenów z `audioFlowTokens` dla kolorów, typografii, odstępów i promieni. Niedozwolone jest użycie hardkodowanych wartości z starej palety (`#16213e`, `#0f3460`, `#1a1a2e`, `#e94560`).

#### Scenario: Tło ekranu
- **WHEN** użytkownik otwiera widok udostępniania
- **THEN** tło ekranu MUSI być tłem `AudioFlowScreen` z `audioFlowTokens.color.background.*`

### Requirement: Nagłówek z przyciskiem powrotu
Ekran SHALL wyświetlać `TopAppBar` z tytułem "Udostępnij" i przyciskiem powrotu po lewej stronie.

#### Scenario: Przycisk powrotu
- **WHEN** użytkownik tapnie przycisk powrotu
- **THEN** aplikacja MUSI wrócić do poprzedniego ekranu przez `router.back()`

### Requirement: Pole email używa `AudioFlowTextField`
Pole tekstowe do wpisania adresu email SHALL używać komponentu `AudioFlowTextField` zamiast surowego `TextInput` ze `backgroundColor: '#16213e'`.

#### Scenario: Pole email
- **WHEN** użytkownik widzi formularz udostępniania
- **THEN** pole email MUSI być `AudioFlowTextField` z placeholder "Email użytkownika..."

#### Scenario: Placeholder color
- **WHEN** pole jest puste
- **THEN** placeholder MUSI być w kolorze `audioFlowTokens.color.text.onSurfaceMuted`

### Requirement: Przycisk "Udostępnij" używa `PearlButton`
Przycisk akcji "Udostępnij" obok pola email SHALL używać `PearlButton`.

#### Scenario: Przycisk akcji
- **WHEN** użytkownik widzi formularz udostępniania
- **THEN** przycisk "Udostępnij" MUSI być `PearlButton`

### Requirement: Lista osób z dostępem używa `GlassPanel`
Każdy wpis na liście osób z dostępem SHALL używać `GlassPanel` zamiast `backgroundColor: '#16213e'`. Przycisk "Odbierz" SHALL używać koloru `audioFlowTokens.color.accent.danger`.

#### Scenario: Karta wpisu dostępu
- **WHEN** lista osób z dostępem jest niepusta
- **THEN** każdy wpis MUSI mieć tło `GlassPanel`

#### Scenario: Kolor przycisku "Odbierz"
- **WHEN** wpis jest widoczny
- **THEN** przycisk "Odbierz" MUSI mieć kolor tekstu `audioFlowTokens.color.accent.danger`

### Requirement: Sekcja kodu QR używa AudioFlow stylu
Sekcja z kodem QR SHALL mieć tło `GlassPanel`. Przycisk "Udostępnij link" SHALL używać `GhostButton`. Przycisk "Wygeneruj QR" SHALL używać `PearlButton`.

#### Scenario: Kontener QR
- **WHEN** kod QR jest wygenerowany
- **THEN** kontener z obrazkiem QR MUSI być owrapowany w `GlassPanel`

#### Scenario: Przycisk "Wygeneruj QR"
- **WHEN** kod QR nie istnieje
- **THEN** przycisk "Wygeneruj QR" MUSI być `PearlButton`

#### Scenario: Przycisk "Udostępnij link"
- **WHEN** kod QR jest wygenerowany
- **THEN** przycisk "Udostępnij link" MUSI być `GhostButton`

#### Scenario: Przycisk "Wygeneruj ponownie"
- **WHEN** kod QR jest wygenerowany
- **THEN** przycisk "Wygeneruj ponownie" MUSI być `GhostButton` lub link tekstowy w kolorze `audioFlowTokens.color.text.onSurfaceMuted`

### Requirement: Tytuły sekcji używają `SectionHeading` lub AudioFlow typografii
Tytuły sekcji ("Udostępnij projekt", "Osoby z dostępem", "Kod QR") SHALL używać komponentu `SectionHeading` lub fontFamily Quicksand Bold z tokenów.

#### Scenario: Tytuł sekcji
- **WHEN** sekcja jest widoczna
- **THEN** tytuł MUSI mieć `fontFamily: 'Quicksand_600SemiBold'` i `color: audioFlowTokens.color.text.onDark`

### Requirement: Typografia zgodna z AudioFlow
Wszystkie teksty body i meta SHALL używać Varela Round. Adres email i rola użytkownika MUSZĄ używać kolorów z tokenów.

#### Scenario: Email osoby z dostępem
- **WHEN** wpis jest widoczny
- **THEN** adres email MUSI mieć `color: audioFlowTokens.color.text.onDark`

#### Scenario: Rola użytkownika
- **WHEN** wpis jest widoczny
- **THEN** rola MUSI mieć `color: audioFlowTokens.color.text.onSurfaceMuted`
