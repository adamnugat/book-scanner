## ADDED Requirements

### Requirement: Etykiety i komunikaty dashboardu używają terminu „audiobook"
Dashboard SHALL używać terminu „audiobook" (i jego odmian) we wszystkich etykietach pasków użycia, komunikatach alertów, tekstach pustych stanów i przyciskach akcji.

#### Scenario: Pasek użycia na dashboardzie
- **WHEN** użytkownik otwiera dashboard lub menu nawigacyjne
- **THEN** pasek użycia SHALL wyświetlać etykietę „Audiobooki" (nie „Projekty")

#### Scenario: Komunikat pustego stanu
- **WHEN** użytkownik nie ma żadnych audiobooków
- **THEN** ekran SHALL wyświetlać tekst „Nie masz jeszcze żadnych audiobooków"

#### Scenario: Komunikaty alertów operacji
- **WHEN** operacja pobrania, usunięcia lub tworzenia audiobooka zakończy się błędem
- **THEN** treść alertu SHALL używać słowa „audiobook" w odpowiedniej formie gramatycznej (np. „Nie udało się pobrać audiobooka", „Nie udało się usunąć audiobooka")

#### Scenario: Chip limitu planu
- **WHEN** użytkownik przegląda ekran cennika
- **THEN** chip limitu SHALL wyświetlać „N audiobooków" (nie „N projektów")
