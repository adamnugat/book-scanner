## ADDED Requirements

### Requirement: Zdjęcie w modalu korekty OCR obsługuje pinch-to-zoom

Zdjęcie wyświetlane w modalu korekty OCR SHALL obsługiwać gest pinch-to-zoom (zbliżanie i oddalanie dwoma palcami). Minimalny zoom wynosi 1× (naturalny rozmiar), maksymalny 3×. W stanie powiększonym zdjęcie MUST być przesuwalne (pan) w granicach obszaru wynikającego z aktualnej skali.

#### Scenario: Powiększenie zdjęcia gestem pinch

- **WHEN** użytkownik wykonuje gest pinch-out (rozsuwanie palców) na zdjęciu w modalu
- **THEN** zdjęcie MUST płynnie powiększyć się proporcjonalnie do gestu, maksymalnie do 3×
- **AND** zdjęcie MUST pozostać wyśrodkowane względem punktu dotyku

#### Scenario: Pomniejszenie zdjęcia gestem pinch

- **WHEN** użytkownik wykonuje gest pinch-in (zsuwanie palców) na zdjęciu w modalu
- **THEN** zdjęcie MUST płynnie pomniejszyć się, nie mniej niż do skali 1×
- **AND** przy osiągnięciu 1× pozycja zdjęcia MUST zresetować się do środka kontenera

#### Scenario: Przesuwanie powiększonego zdjęcia

- **WHEN** zdjęcie jest powiększone (scale > 1×) i użytkownik przesuwa palcem po zdjęciu
- **THEN** zdjęcie MUST przesuwać się w kierunku gestu
- **AND** zdjęcie MUST być ograniczone do widocznych granic wynikających z aktualnej skali — nie może być przesunięte poza obszar zawierający powiększoną treść

### Requirement: Double-tap resetuje lub ustawia zoom do 2×

Dwukrotne stuknięcie w zdjęcie w modalu korekty OCR SHALL przełączać zoom między 1× a 2×.

#### Scenario: Double-tap przy skali 1× — powiększenie do 2×

- **WHEN** zdjęcie wyświetlane jest w skali 1× i użytkownik dwukrotnie stuknie w zdjęcie
- **THEN** zdjęcie MUST powiększyć się do 2×
- **AND** pozycja MUST wyśrodkować się (translate 0, 0)

#### Scenario: Double-tap przy skali > 1× — reset do 1×

- **WHEN** zdjęcie jest powiększone (scale > 1×) i użytkownik dwukrotnie stuknie w zdjęcie
- **THEN** zdjęcie MUST powrócić do skali 1× z wyśrodkowaną pozycją (translate 0, 0)

### Requirement: Zoom zdjęcia nie blokuje edycji pola tekstowego

Gesty zoom/pan MUST działać wyłącznie na obszarze zdjęcia. Pole tekstowe z tekstem OCR MUST pozostać w pełni interaktywne i niezależne od gestów zoom.

#### Scenario: Edycja tekstu po użyciu zoom

- **WHEN** użytkownik powiększył zdjęcie, a następnie dotknął pola tekstowego
- **THEN** klawiatura MUST się pojawić i pole tekstowe MUST przyjąć fokus
- **AND** zdjęcie MUST pozostać w aktualnym stanie zoom (nie resetuje się automatycznie)
