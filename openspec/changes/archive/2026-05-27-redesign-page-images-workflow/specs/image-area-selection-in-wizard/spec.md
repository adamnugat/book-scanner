## MODIFIED Requirements

### Requirement: Użytkownik może wybrać obszary OCR dla zdjęcia bezpośrednio w Kroku 2 kreatora zaawansowanego

Po dodaniu zdjęć, gdy przełącznik „wybór obszarów" w ustawieniach ogólnych jest włączony, system SHALL udostępnić przy każdym zdjęciu ikonę obszarów otwierającą **modal** wyboru obszarów OCR (powiększone zdjęcie z rysowaniem rejonów), zanim zostanie uruchomiony OCR. Gdy przełącznik jest wyłączony, ikona obszarów MUST być wyszarzona z literą „A", a OCR MUST działać na całym zdjęciu.

#### Scenario: Ikona obszarów aktywna po włączeniu przełącznika

- **WHEN** użytkownik włączył przełącznik „wybór obszarów" i na liście widoczne są zdjęcia
- **THEN** system MUST wyświetlić przy każdej karcie aktywną ikonę wyboru obszarów OCR

#### Scenario: Otwarcie modala wyboru obszarów

- **WHEN** użytkownik kliknie ikonę wyboru obszarów przy konkretnym zdjęciu
- **THEN** system MUST otworzyć modal z powiększonym podglądem tego zdjęcia, umożliwiający rysowanie i usuwanie prostokątnych obszarów OCR oraz dodanie kolejnego rejonu lub zapisanie

#### Scenario: Powrót do listy po edycji obszarów

- **WHEN** użytkownik zapisze lub anuluje edycję obszarów w modalu
- **THEN** system MUST zamknąć modal i zachować listę zdjęć oraz ich kolejność

#### Scenario: Obszary uwzględnione w OCR

- **WHEN** użytkownik kliknie submit po zdefiniowaniu obszarów dla jednego lub więcej zdjęć
- **THEN** system MUST uruchomić OCR z uwzględnieniem zdefiniowanych obszarów `TextRegion` tylko dla tych zdjęć, a dla pozostałych — na całym zdjęciu
