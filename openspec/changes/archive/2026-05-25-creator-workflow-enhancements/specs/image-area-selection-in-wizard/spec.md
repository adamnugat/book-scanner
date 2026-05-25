## ADDED Requirements

### Requirement: Użytkownik może wybrać obszary OCR dla zdjęcia bezpośrednio w Kroku 2 kreatora zaawansowanego

W trybie zaawansowanym, po dodaniu zdjęć, system SHALL wyświetlić przy każdym zdjęciu przycisk otwierający widok wyboru obszarów OCR, zanim zostanie uruchomiony OCR.

#### Scenario: Przycisk obszarów pojawia się na karcie zdjęcia

- **WHEN** użytkownik jest w Kroku 2 kreatora w trybie zaawansowanym i na liście widoczne są wgrane lub oczekujące zdjęcia
- **THEN** system MUST wyświetlić przy każdej karcie zdjęcia przycisk wyboru obszarów OCR (ikona)

#### Scenario: Otwarcie widoku wyboru obszarów

- **WHEN** użytkownik kliknie przycisk wyboru obszarów przy konkretnym zdjęciu
- **THEN** system MUST otworzyć widok podglądu tego zdjęcia umożliwiający rysowanie i usuwanie prostokątnych obszarów OCR

#### Scenario: Powrót do listy zdjęć po edycji obszarów

- **WHEN** użytkownik zapisze lub anuluje edycję obszarów w widoku podglądu
- **THEN** system MUST powrócić do Kroku 2 z zachowaną listą zdjęć i ich kolejnością

#### Scenario: Obszary zapisane przed OCR

- **WHEN** użytkownik kliknie submit w Kroku 2 po zdefiniowaniu obszarów dla jednego lub więcej zdjęć
- **THEN** system MUST uruchomić OCR z uwzględnieniem zdefiniowanych obszarów TextRegion
