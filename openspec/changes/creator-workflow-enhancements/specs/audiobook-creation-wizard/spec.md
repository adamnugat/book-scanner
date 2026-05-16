## MODIFIED Requirements

### Requirement: Tryb automatyczny — sekwencyjny OCR → TTS

W trybie automatycznym system SHALL zagwarantować zakończenie OCR przed wywołaniem TTS.

#### Scenario: Submit w trybie automatycznym

- **WHEN** użytkownik kliknie przycisk submit w trybie automatycznym
- **THEN** system MUST kolejno: (1) wgrać zdjęcia, (2) uruchomić OCR, (3) czekać na zakończenie OCR dla wszystkich scen, (4) uruchomić TTS, (5) czekać na wygenerowanie audio, (6) przekierować do odtwarzacza

#### Scenario: Timeout oczekiwania na OCR

- **WHEN** OCR nie zakończy się w ciągu 90 sekund
- **THEN** system MUST przerwać oczekiwanie i wyświetlić komunikat błędu z możliwością ponowienia

#### Scenario: Ekran ładowania podczas procesu automatycznego

- **WHEN** trwa którykolwiek z kroków przepływu automatycznego
- **THEN** system MUST wyświetlać ekran ładowania/postępu uniemożliwiający interakcję

### Requirement: Tryb zaawansowany — karta zdjęcia z ikoną usunięcia i przyciskiem obszarów

W trybie zaawansowanym, lista zdjęć SHALL prezentować przy każdym zdjęciu: uchwyt do zmiany kolejności, ikonę usunięcia (nie tekst) oraz przycisk wyboru obszarów OCR.

#### Scenario: Karta zdjęcia w trybie zaawansowanym

- **WHEN** użytkownik jest w Kroku 2 w trybie zaawansowanym
- **THEN** każda karta zdjęcia MUST zawierać: miniaturę zdjęcia, uchwyt reorder, ikonę usunięcia (kosz) oraz przycisk/ikonę wyboru obszarów OCR

#### Scenario: Usunięcie zdjęcia ikoną

- **WHEN** użytkownik kliknie ikonę kosza przy zdjęciu
- **THEN** system MUST usunąć to zdjęcie z listy (zachowanie identyczne jak dotychczasowy przycisk tekstowy)

### Requirement: Tryb zaawansowany — Krok 2 submit uruchamia OCR i przenosi do Kroku 3

#### Scenario: Submit w trybie zaawansowanym

- **WHEN** użytkownik kliknie submit w Kroku 2 w trybie zaawansowanym
- **THEN** system MUST wgrać zdjęcia, uruchomić OCR, a następnie przekierować do Kroku 3 (`projects/new/review`)

### Requirement: Tryb zaawansowany — Krok 3 korekta OCR i submit TTS

W Kroku 3 system SHALL wyświetlić wyniki OCR dla każdego zdjęcia w edytowalnym `textarea` i po zatwierdzeniu uruchomić TTS.

#### Scenario: Wyświetlenie wyników OCR w Kroku 3

- **WHEN** użytkownik trafia do Kroku 3 po OCR
- **THEN** system MUST wyświetlić dla każdego zdjęcia edytowalny `textarea` z rozpoznanym tekstem

#### Scenario: Ręczna korekta tekstu OCR

- **WHEN** użytkownik edytuje tekst w `textarea` dla wybranej sceny
- **THEN** system MUST zachować edytowane wartości lokalnie do czasu zatwierdzenia

#### Scenario: Submit w Kroku 3 — TTS i zakończenie kreatora

- **WHEN** użytkownik kliknie submit w Kroku 3
- **THEN** system MUST zapisać poprawione teksty, uruchomić TTS i po wygenerowaniu audio przekierować do odtwarzacza
