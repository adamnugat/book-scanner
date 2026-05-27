## ADDED Requirements

### Requirement: Korekta tekstu OCR odbywa się w modalu

Korekta tekstu OCR dla pojedynczego zdjęcia SHALL być prezentowana jako modal otwierany z ekranu zdjęć, a nie jako osobny ekran nawigacyjny. Modal MUST zawierać w górnej części miniaturkę zdjęcia, a poniżej edytowalne pole tekstowe z tekstem utworzonym przez OCR oraz przycisk „Zapisz".

#### Scenario: Otwarcie modala korekty

- **WHEN** użytkownik dotyka akcji „Korekta OCR" przy zdjęciu (gdy korekta OCR jest włączona)
- **THEN** aplikacja MUST otworzyć modal korekty dla tego zdjęcia
- **AND** modal MUST pokazać miniaturkę zdjęcia u góry oraz pole tekstowe z tekstem OCR poniżej

#### Scenario: Zapis zmienionego tekstu

- **WHEN** użytkownik edytuje tekst i dotyka „Zapisz"
- **THEN** zmieniony tekst MUST zostać zapisany i przypisany do tego zdjęcia
- **AND** modal MUST się zamknąć i wrócić do ekranu zdjęć

#### Scenario: Zmieniony tekst zasila TTS

- **WHEN** zdjęcie miało już przypisany plik audio, a tekst został zmieniony w modalu korekty
- **THEN** kolejne TTS dla tego zdjęcia MUST być wykonane tylko na zmienionym tekście
