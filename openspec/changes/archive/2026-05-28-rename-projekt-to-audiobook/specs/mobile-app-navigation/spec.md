## ADDED Requirements

### Requirement: Tytuły ekranów używają terminu „audiobook"
Ekrany nawigacyjne SHALL używać terminu „audiobook" (i jego odmian) we wszystkich tytułach widocznych dla użytkownika. Tytuł ekranu szczegółów SHALL brzmieć „Audiobook". Tytuł ekranu edycji SHALL brzmieć „Edycja audiobooka".

#### Scenario: Tytuł ekranu szczegółów audiobooka
- **WHEN** użytkownik przechodzi na ekran szczegółów audiobooka (`projects/[id]/index`)
- **THEN** nagłówek Stack SHALL wyświetlać tekst „Audiobook"

#### Scenario: Tytuł ekranu edycji audiobooka
- **WHEN** użytkownik przechodzi na ekran edycji (`projects/[id]/edit`)
- **THEN** nagłówek Stack SHALL wyświetlać tekst „Edycja audiobooka"
