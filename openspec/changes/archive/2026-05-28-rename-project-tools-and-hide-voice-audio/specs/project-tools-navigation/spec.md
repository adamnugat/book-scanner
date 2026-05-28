## ADDED Requirements

### Requirement: Kafelek edycji audiobooka zastępuje "Zdjęcia stron"

Sekcja "Narzędzia projektu" na ekranie szczegółów projektu SHALL wyświetlać kafelek nawigacji do ekranu edycji audiobooka z tytułem "Edytuj audiobook" i bez pola summary. Kafelek MUST prowadzić do trasy `/(app)/projects/[id]/images`.

#### Scenario: Kafelek ma poprawny tytuł

- **WHEN** użytkownik otwiera ekran szczegółów projektu
- **THEN** sekcja narzędzi MUSI zawierać kafelek z tytułem "Edytuj audiobook"
- **AND** kafelek NIE MOŻE wyświetlać żadnego tekstu summary (statusu projektu)

#### Scenario: Kafelek nawiguje do edycji audiobooka

- **WHEN** użytkownik tapnie kafelek "Edytuj audiobook"
- **THEN** aplikacja MUSI nawigować do ekranu `/(app)/projects/[id]/images`

### Requirement: Kafelek "Głos i audio" jest ukryty

Kafelek nawigacji do ekranu głosu i audio SHALL być niewidoczny w sekcji narzędzi. Trasa `/(app)/projects/[id]/voice` i jej plik ekranu pozostają w kodzie niezmienione.

#### Scenario: Kafelek "Głos i audio" nie jest renderowany

- **WHEN** użytkownik otwiera ekran szczegółów projektu
- **THEN** sekcja narzędzi NIE MOŻE zawierać kafelka z tytułem "Głos i audio"

### Requirement: Licznik narzędzi odzwierciedla liczbę widocznych kafelków

Licznik w nagłówku sekcji "Narzędzia projektu" SHALL wyświetlać `2 dostępne`, odpowiadając widocznym kafelkom: "Edytuj audiobook" i "Udostępnij".

#### Scenario: Licznik pokazuje 2

- **WHEN** użytkownik otwiera ekran szczegółów projektu
- **THEN** nagłówek sekcji MUSI zawierać tekst "2 dostępne"
