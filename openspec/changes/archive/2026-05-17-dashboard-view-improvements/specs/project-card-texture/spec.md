## ADDED Requirements

### Requirement: Deterministyczna tekstura SVG dla okładki projektu

System SHALL renderować teksturę SVG jako okładkę projektu gdy `coverUrl` nie jest dostępne. Tekstura SHALL być dobierana deterministycznie na podstawie `projectId` tak, żeby ten sam projekt zawsze pokazywał ten sam wzór. Kolory tekstur SHALL używać palety `audioFlowTokens`.

#### Scenario: Projekt bez coverUrl wyświetla teksturę SVG

- **WHEN** `ProjectCard` jest renderowana z `coverUrl` równym `null` lub `undefined`
- **THEN** system wyświetla komponent `ProjectCoverTexture` zamiast emoji `📖`
- **THEN** tekstura jest jedną z 10 predefiniowanych wzorów SVG (koła, kwadraty, fale, sześciokąty, ukośne paski, gradient kół, romby, spirale prostokątów, kafelki, abstrakcyjne cienie)

#### Scenario: Ta sama tekstura dla tego samego projektu

- **WHEN** `ProjectCoverTexture` jest renderowana dwukrotnie z tym samym `projectId`
- **THEN** obydwa rendery wyświetlają identyczny wzór (indeks tekstury 0..9 pochodzi z `sum(charCodes) % 10`)

#### Scenario: Projekt z coverUrl wyświetla zdjęcie

- **WHEN** `ProjectCard` jest renderowana z niepustym `coverUrl`
- **THEN** system wyświetla obraz z podanego URL, a nie teksturę SVG

#### Scenario: Tekstury używają kolorów design systemu

- **WHEN** tekstura SVG jest renderowana
- **THEN** użyte kolory należą do palety `audioFlowTokens.color` (accent, surface, text)
- **THEN** tekstura wizualnie pasuje do ciemnego tła AudioFlow
