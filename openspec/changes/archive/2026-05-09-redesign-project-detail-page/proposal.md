## Why

Obecna strona szczegółów projektu (`apps/mobile/app/(app)/projects/[id]/index.tsx`) jest przeładowana technicznymi metadanymi i przyciskami ułożonymi jeden pod drugim, co sprawia, że wygląda jak zrzut danych, a nie centrum dowodzenia audiobookiem. Użytkownik potrzebuje interfejsu, który inteligentnie dopasowuje się do stanu projektu: jeśli audiobook jest gotowy do słuchania, głównym elementem powinien być odtwarzacz i okładka; jeśli jest w trakcie tworzenia, głównym elementem powinna być informacja o następnym kroku. Zmiana ta znacząco poprawi użyteczność i estetykę aplikacji.

## What Changes

- **Przebudowa UI ekranu szczegółów projektu**:
  - Ukrycie technicznych metadanych (np. dokładne daty utworzenia, wstawki).
  - Przeniesienie akcji destruktywnych i zarządczych (edycja, usuwanie) do osobnego menu (np. pod ikoną zębatki).
  - Wprowadzenie układu kafelkowego dla narzędzi projektu (Zdjęcia stron, Głos i audio, Udostępnij).
- **Dwa stany widoku**:
  - **Stan "Konsumpcja" (jest wygenerowane audio)**: Duża okładka wypełniająca górną połowę ekranu (od krawędzi do krawędzi), z przyciskiem odtwarzacza na dole okładki. Pod spodem kafelki narzędzi.
  - **Stan "Tworzenie" (brak audio)**: Wyraźna karta "Następny krok" (np. informacja o OCR lub TTS) na górze, a pod nią kafelki narzędzi.
- **Logika**: Pobieranie listy ścieżek audio (`api.getAudioTracks`) podczas ładowania ekranu, aby określić, który stan wyświetlić.

## Capabilities

### New Capabilities

- `project-dashboard-ui`: Zmiana interfejsu ekranu głównego projektu na dynamiczny dashboard zależny od stanu audio (okładka edge-to-edge vs karta akcji).

### Modified Capabilities

- Brak zmian w wymaganiach biznesowych dla istniejących modułów (API i logika pozostają bez zmian, zmieniamy tylko UI).

## Impact

- `apps/mobile/app/(app)/projects/[id]/index.tsx`: Całkowita przebudowa komponentu wizualnego.
- `apps/mobile/app/(app)/projects/[id]/_layout.tsx` (opcjonalnie): Dodanie przycisku ustawień w nagłówku nawigacji.
- Brak wpływu na backend, API, bazę danych czy modele. Wymagane będzie jedynie zamockowanie okładki (np. gradient lub placeholder), dopóki nie dodamy pełnej obsługi obrazków okładek w przyszłości (choć w modelu `ProjectResponse` mamy już `coverUrl`).
