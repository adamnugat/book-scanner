## ADDED Requirements

### Requirement: Dynamiczny tytuł ekranu zdjęć

Ekran zdjęć projektu (`apps/mobile/app/(app)/projects/[id]/images.tsx`) SHALL prezentować tytuł zależny od stanu listy: „Dodaj zdjęcia" gdy lista jest pusta oraz „Edytuj zdjęcia" gdy zawiera co najmniej jedno zdjęcie. Tytuł MUST aktualizować się natychmiast po dodaniu pierwszego zdjęcia i po usunięciu ostatniego zdjęcia.

#### Scenario: Brak zdjęć

- **WHEN** ekran zdjęć renderuje się, a projekt nie ma żadnych zdjęć ani plików oczekujących
- **THEN** tytuł ekranu MUST brzmieć „Dodaj zdjęcia"

#### Scenario: Po dodaniu pierwszego zdjęcia

- **WHEN** użytkownik doda pierwsze zdjęcie z galerii lub aparatu
- **THEN** tytuł ekranu MUST zmienić się na „Edytuj zdjęcia"

#### Scenario: Po usunięciu ostatniego zdjęcia

- **WHEN** użytkownik usunie ostatnie zdjęcie z listy
- **THEN** tytuł ekranu MUST wrócić do „Dodaj zdjęcia"

### Requirement: Footer z przyciskami galerii i aparatu

Dolne menu ekranu zdjęć (`AudioFlowFooterMenu`) SHALL udostępniać po lewej stronie przycisk galerii otwierający wybór zdjęć z galerii telefonu oraz po prawej stronie przycisk aparatu otwierający aparat telefonu. Dodane zdjęcie MUST natychmiast pojawić się na liście zdjęć.

#### Scenario: Przycisk galerii

- **WHEN** użytkownik dotyka lewego przycisku footera
- **THEN** aplikacja MUST otworzyć wybór zdjęć z galerii telefonu
- **AND** wybrane zdjęcia MUST pojawić się na liście zdjęć

#### Scenario: Przycisk aparatu

- **WHEN** użytkownik dotyka prawego przycisku footera
- **THEN** aplikacja MUST otworzyć aparat telefonu
- **AND** zrobione zdjęcie MUST pojawić się na liście zdjęć

### Requirement: Pasek licznika i przełączniki ustawień ogólnych

Gdy lista zawiera co najmniej jedno zdjęcie, między tytułem a listą zdjęć ekran SHALL wyświetlać pasek z licznikiem dodanych zdjęć w formacie „Zdjęć N" oraz dwa przełączniki ustawień ogólnych dla wszystkich zdjęć: „wybór obszarów" i „korekta OCR". Oba przełączniki MUST być domyślnie wyłączone.

#### Scenario: Pasek licznika ukryty przy pustej liście

- **WHEN** lista zdjęć jest pusta
- **THEN** pasek licznika i przełączniki ustawień NIE MUST być renderowane

#### Scenario: Licznik odzwierciedla liczbę zdjęć

- **WHEN** lista zawiera 3 zdjęcia
- **THEN** pasek MUST pokazywać tekst „Zdjęć 3"
- **AND** wartość MUST aktualizować się po dodaniu lub usunięciu zdjęcia

#### Scenario: Domyślny stan przełączników

- **WHEN** pasek ustawień renderuje się po raz pierwszy
- **THEN** przełącznik „wybór obszarów" MUST być wyłączony
- **AND** przełącznik „korekta OCR" MUST być wyłączony

### Requirement: Przełącznik „wybór obszarów" bramkuje edycję rejonów OCR

Przełącznik „wybór obszarów" SHALL sterować dostępnością edycji rejonów OCR per zdjęcie. Gdy wyłączony, ikona obszarów na karcie zdjęcia MUST być wyszarzona z literą „A" (OCR działa automatycznie na całym zdjęciu). Gdy włączony, użytkownik MUST móc otworzyć modal wyboru obszarów dla pojedynczego zdjęcia.

#### Scenario: Włączenie wyboru obszarów

- **WHEN** użytkownik włącza przełącznik „wybór obszarów"
- **THEN** ikona obszarów na każdej karcie MUST stać się aktywna (klikalna)
- **AND** dotknięcie ikony obszarów MUST otworzyć modal wyboru obszarów OCR dla danego zdjęcia

#### Scenario: Wyłączony wybór obszarów

- **WHEN** przełącznik „wybór obszarów" jest wyłączony
- **THEN** ikona obszarów na karcie MUST być wyszarzona z literą „A"
- **AND** dotknięcie tej ikony NIE MUST otwierać modala

### Requirement: Przełącznik „korekta OCR" zatrzymuje proces po OCR

Przełącznik „korekta OCR" SHALL sterować tym, czy proces zatrzymuje się po OCR na korektę tekstu. Gdy wyłączony, ikona korekty OCR na karcie MUST być wyszarzona z literą „A" (brak ręcznej korekty). Gdy włączony, po wykonaniu OCR submit MUST zatrzymać się, a przy każdym zdjęciu MUST być dostępna akcja „Korekta OCR" otwierająca modal korekty.

#### Scenario: Wyłączona korekta OCR

- **WHEN** przełącznik „korekta OCR" jest wyłączony
- **THEN** ikona korekty OCR na karcie MUST być wyszarzona z literą „A"
- **AND** submit MUST przejść z OCR bezpośrednio do TTS bez przystanku na korektę

#### Scenario: Włączona korekta OCR

- **WHEN** przełącznik „korekta OCR" jest włączony, a submit zakończył fazę OCR
- **THEN** proces MUST zatrzymać się przed TTS
- **AND** każda karta zdjęcia MUST udostępniać akcję „Korekta OCR" otwierającą modal korekty tekstu

### Requirement: Submit uruchamia sekwencję OCR→TTS bez zmiany widoku

Środkowy przycisk submitu w footerze ekranu zdjęć SHALL uruchamiać dla wszystkich zdjęć po kolei sekwencję OCR, a następnie TTS, bez nawigacji do osobnych ekranów Sceny OCR / Głos Lektora. Submit MUST pokazywać postęp w obrębie ekranu zdjęć.

OCR per zdjęcie MUST działać warunkowo: jeśli zdjęcie nie ma zaznaczonych obszarów OCR — na całym zdjęciu; jeśli ma zaznaczone obszary — tylko na tych obszarach. Jeśli włączona jest „korekta OCR", proces MUST zatrzymać się po OCR do czasu zatwierdzenia korekt.

TTS per zdjęcie MUST działać warunkowo: jeśli zdjęcie nie ma przypisanego pliku audio — na całym tekście OCR; jeśli ma przypisany plik audio — tylko na tekście zmienionym w korekcie OCR. Po TTS do zdjęcia MUST zostać przypisany plik audio.

#### Scenario: OCR na całym zdjęciu

- **WHEN** submit przetwarza zdjęcie bez zaznaczonych obszarów OCR
- **THEN** OCR MUST zostać wykonany na całym zdjęciu

#### Scenario: OCR tylko na obszarach

- **WHEN** submit przetwarza zdjęcie z co najmniej jednym zaznaczonym obszarem OCR
- **THEN** OCR MUST zostać wykonany tylko na zaznaczonych obszarach

#### Scenario: TTS na pełnym tekście

- **WHEN** submit przetwarza zdjęcie bez przypisanego pliku audio
- **THEN** TTS MUST zostać wykonany na całym tekście OCR
- **AND** wynikowy plik audio MUST zostać przypisany do zdjęcia

#### Scenario: TTS tylko na zmienionym tekście

- **WHEN** submit przetwarza zdjęcie z przypisanym plikiem audio, którego tekst został zmieniony w korekcie OCR
- **THEN** TTS MUST zostać wykonany tylko na zmienionym tekście
- **AND** zaktualizowany plik audio MUST zostać przypisany do zdjęcia

#### Scenario: Submit nie zmienia widoku w trakcie

- **WHEN** trwa sekwencja OCR/TTS
- **THEN** użytkownik MUST pozostać na ekranie zdjęć z widocznym postępem

### Requirement: Zakończenie procesu prowadzi do szczegółów audiobooka

Po zakończeniu całej sekwencji bez błędów ekran SHALL pokazać komunikat „Wszystkie zdjęcia zostały przetworzone" i przenieść użytkownika do widoku szczegółów audiobooka (odtwarzacz). Gdy którykolwiek etap zakończy się błędem, użytkownik MUST pozostać na ekranie zdjęć z komunikatem błędu.

#### Scenario: Sukces całej sekwencji

- **WHEN** OCR i TTS zakończą się pomyślnie dla wszystkich zdjęć
- **THEN** aplikacja MUST pokazać komunikat „Wszystkie zdjęcia zostały przetworzone"
- **AND** MUST przenieść użytkownika do widoku szczegółów audiobooka, w którym może odtworzyć audiobook

#### Scenario: Błąd w trakcie sekwencji

- **WHEN** OCR lub TTS zakończy się błędem dla któregokolwiek zdjęcia
- **THEN** użytkownik MUST pozostać na ekranie zdjęć
- **AND** aplikacja MUST wyświetlić komunikat błędu (z backendu lub fallback)
