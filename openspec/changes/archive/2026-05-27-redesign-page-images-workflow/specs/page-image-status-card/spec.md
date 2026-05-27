## ADDED Requirements

### Requirement: Układ trzykolumnowy karty zdjęcia

Karta zdjęcia (`apps/mobile/components/PageImageCard.tsx`) SHALL prezentować trzy kolumny w jednym wierszu: kolumna 1 — uchwyt drag-and-drop z numerem porządkowym; kolumna 2 — dwa wiersze (miniaturka + nazwa pliku, rząd ikon statusu); kolumna 3 — przycisk edycji oraz kosz usuwania. Ten sam komponent MUST być używany w trybie zaawansowanym kreatora i w widoku „Zdjęcia stron".

#### Scenario: Trzy kolumny renderowane

- **WHEN** karta zdjęcia renderuje się
- **THEN** użytkownik MUST widzieć po lewej uchwyt drag-and-drop z numerem, w środku dwa wiersze (miniaturka+nazwa, ikony statusu), a po prawej przycisk edycji i kosz

#### Scenario: Współdzielony komponent

- **WHEN** karta renderuje się w kreatorze (tryb zaawansowany) oraz w widoku „Zdjęcia stron"
- **THEN** oba ekrany MUST importować ten sam komponent `PageImageCard` z `apps/mobile/components/`

### Requirement: Uchwyt drag-and-drop z numerem porządkowym

Kolumna 1 karty SHALL zawierać paskowaną ikonę uchwytu drag-and-drop z numerem porządkowym zdjęcia w środku. Numer MUST aktualizować się po każdej zmianie kolejności. Zmiana kolejności MUST odbywać się wyłącznie przez przeciągnięcie i upuszczenie; strzałki góra/dół MUST NOT być renderowane.

#### Scenario: Numer porządkowy widoczny

- **WHEN** karta zdjęcia na pozycji 2 renderuje się
- **THEN** uchwyt drag-and-drop MUST pokazywać numer „2" w środku ikony

#### Scenario: Numer aktualizuje się po reorderze

- **WHEN** użytkownik przeciągnie zdjęcie z pozycji 3 na pozycję 1
- **THEN** numery porządkowe wszystkich kart MUST zostać przeliczone i wyświetlone zgodnie z nową kolejnością

#### Scenario: Brak strzałek reorder

- **WHEN** karta zdjęcia renderuje się
- **THEN** żaden węzeł nie MUST renderować ikon `arrow-up` ani `arrow-down`

### Requirement: Sekwencyjny rząd ikon statusu

Drugi wiersz kolumny 2 SHALL zawierać trzy ikony statusu ułożone obok siebie i połączone strzałkami w kolejności: obszary → korekta OCR → audio, sygnalizując sekwencyjny proces. Ikona obszarów MUST pokazywać liczbę zaznaczonych obszarów lub być wyszarzona z literą „A", gdy wybór obszarów jest wyłączony w ustawieniach ogólnych. Ikona korekty OCR MUST sygnalizować, czy zdjęcie zostało przetworzone przez OCR, lub być wyszarzona z literą „A", gdy korekta OCR jest wyłączona. Ikona audio MUST sygnalizować, czy do zdjęcia przypisano plik audio (TTS).

#### Scenario: Ikony w kolejności ze strzałkami

- **WHEN** rząd ikon statusu renderuje się
- **THEN** ikony MUST być ułożone w kolejności obszary → korekta OCR → audio
- **AND** między kolejnymi ikonami MUST być widoczna strzałka kierunku

#### Scenario: Ikona obszarów z licznikiem

- **WHEN** zdjęcie ma 3 zaznaczone obszary, a wybór obszarów jest włączony
- **THEN** ikona obszarów MUST pokazywać liczbę „3"

#### Scenario: Ikona obszarów wyszarzona „A"

- **WHEN** wybór obszarów jest wyłączony w ustawieniach ogólnych
- **THEN** ikona obszarów MUST być wyszarzona i oznaczona literą „A"

#### Scenario: Ikona korekty OCR wyszarzona „A"

- **WHEN** korekta OCR jest wyłączona w ustawieniach ogólnych
- **THEN** ikona korekty OCR MUST być wyszarzona i oznaczona literą „A"

#### Scenario: Ikona audio po TTS

- **WHEN** do zdjęcia przypisano plik audio
- **THEN** ikona audio MUST sygnalizować ukończony etap (aktywny stan)

### Requirement: Przycisk edycji odblokowuje ukończone etapy

Kolumna 3 SHALL zawierać przycisk edycji, którego dotknięcie ponownie czyni klikalnymi ikony etapów, które zostały już wykonane. Pozwala to wrócić do wcześniejszego etapu (np. ponowny wybór obszarów lub korekta OCR) dla danego zdjęcia.

#### Scenario: Odblokowanie ikon etapów

- **WHEN** użytkownik dotyka przycisku edycji na karcie zdjęcia z ukończonymi etapami
- **THEN** ikony ukończonych etapów MUST stać się ponownie klikalne dla tego zdjęcia

### Requirement: Kosz usuwa zdjęcie z listy

Kolumna 3 SHALL zawierać przycisk kosza (`trash-2`) usuwający zdjęcie z listy. Po usunięciu numery porządkowe pozostałych kart MUST zostać przeliczone.

#### Scenario: Usunięcie zdjęcia

- **WHEN** użytkownik dotyka kosza na karcie zdjęcia
- **THEN** zdjęcie MUST zostać usunięte z listy
- **AND** numery porządkowe pozostałych kart MUST zostać przeliczone
