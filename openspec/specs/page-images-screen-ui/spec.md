## ADDED Requirements

### Requirement: Ekran używa AudioFlow design system
Ekran zdjęć stron (`images.tsx`) SHALL używać wyłącznie tokenów z `audioFlowTokens` dla kolorów, typografii, odstępów i promieni. Niedozwolone jest użycie hardkodowanych wartości z starej palety (`#16213e`, `#0f3460`, `#1a1a2e`, `#e94560`, `#06d6a0`).

#### Scenario: Tło ekranu
- **WHEN** użytkownik otwiera widok zdjęć stron
- **THEN** tło ekranu MUSI być tłem `AudioFlowScreen` (burgundowe gradient) z `audioFlowTokens.color.background.*`

#### Scenario: Karty zdjęć
- **WHEN** lista zdjęć jest niepusta
- **THEN** każda karta zdjęcia MUSI być owrapowana w `GlassPanel` z `audioFlowTokens.color.surface.glass` jako tło

### Requirement: Nagłówek z przyciskiem powrotu
Ekran SHALL wyświetlać `TopAppBar` z tytułem "Zdjęcia stron" i przyciskiem powrotu po lewej stronie.

#### Scenario: Przycisk powrotu
- **WHEN** użytkownik tapnie przycisk powrotu w `TopAppBar`
- **THEN** aplikacja MUSI wrócić do poprzedniego ekranu przez `router.back()`

#### Scenario: Liczba zdjęć w tytule
- **WHEN** załaduje się lista zdjęć
- **THEN** tytuł w `TopAppBar` LUB podnagłówek MUSI wyświetlać liczbę zdjęć (np. "Zdjęcia stron · 3")

### Requirement: Przyciski akcji używają AudioFlow komponentów
Przyciski "Galeria", "Aparat" i "Dalej →" w dolnym pasku SHALL używać komponentów `GhostButton` lub `PearlButton` zamiast surowych `Pressable` ze starymi kolorami.

#### Scenario: Przycisk głównej akcji
- **WHEN** widok wyświetla dolny pasek akcji
- **THEN** przycisk "Dalej →" (jeśli widoczny) MUSI używać `PearlButton` z kolorem `audioFlowTokens.color.accent.pearl`

#### Scenario: Przyciski drugorzędne
- **WHEN** widok wyświetla dolny pasek akcji
- **THEN** przyciski "Galeria" i "Aparat" MUSZĄ używać `GhostButton`

### Requirement: Panel oczekujących zdjęć używa AudioFlow stylu
Panel podglądu zdjęć przed wysłaniem (`pendingPanel`) SHALL używać `GlassPanel` zamiast `backgroundColor: '#16213e'`. Przycisk "Wyślij zdjęcia" SHALL używać `PearlButton`.

#### Scenario: Panel podglądu
- **WHEN** użytkownik wybierze zdjęcia z galerii lub aparatu
- **THEN** panel podglądu MUSI mieć tło `GlassPanel` z borderColor z tokenów

#### Scenario: Przycisk potwierdzenia wysyłki
- **WHEN** panel podglądu jest widoczny
- **THEN** przycisk "Wyślij zdjęcia" MUSI być `PearlButton`

### Requirement: Overlay upload używa glassmorfizmu
Overlay postępu przesyłania SHALL używać `rgba` z `audioFlowTokens.color.surface.glass` dla tła i `GlassPanel` dla kontenera listy postępu.

#### Scenario: Kolory statusów w overlay
- **WHEN** plik jest przesyłany
- **THEN** status "done" MUSI używać `audioFlowTokens.color.accent.softGreen`, status "error" MUSI używać `audioFlowTokens.color.accent.danger`, status "uploading" MUSI używać `audioFlowTokens.color.accent.pearl`

### Requirement: Drag-and-drop overlay używa pearl accent
Overlay drag-and-drop na web SHALL używać `audioFlowTokens.color.accent.pearlBorder` dla ramki i `audioFlowTokens.color.accent.pearl` dla tekstu zamiast `#e94560`.

#### Scenario: Kolor drop overlay
- **WHEN** użytkownik przeciąga plik nad ekranem na platformie web
- **THEN** obramowanie overlay MUSI być w kolorze `audioFlowTokens.color.accent.pearlBorder`

### Requirement: Typografia zgodna z AudioFlow
Wszystkie teksty SHALL używać fontFamily z `audioFlowTokens.typography.*`. Tytuły sekcji MUSZĄ używać Quicksand Bold, teksty pomocnicze i meta MUSZĄ używać Varela Round.

#### Scenario: Tytuł główny
- **WHEN** ekran jest załadowany
- **THEN** tytuł ekranu MUSI mieć `fontFamily: 'Quicksand_700Bold'` i `color: audioFlowTokens.color.text.onDark`

#### Scenario: Teksty meta (rozmiar pliku, numer strony)
- **WHEN** karta zdjęcia jest widoczna
- **THEN** teksty pomocnicze MUSZĄ mieć `color: audioFlowTokens.color.text.onSurfaceMuted`
