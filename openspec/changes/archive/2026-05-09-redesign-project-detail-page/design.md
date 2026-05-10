## Context

Obecny ekran szczegółów projektu (`apps/mobile/app/(app)/projects/[id]/index.tsx`) wyświetla prostą listę pól tekstowych i przycisków. Zgodnie z propozycją, chcemy przekształcić go w dynamiczny dashboard, który dostosowuje się do stanu projektu. Głównym wyzwaniem jest obsługa dwóch stanów wizualnych:

1. **Stan "Konsumpcja"**: Gdy projekt posiada wygenerowane audio, okładka zajmuje górne 50% ekranu (od krawędzi do krawędzi), a na niej znajduje się przycisk odtwarzania.
2. **Stan "Tworzenie"**: Gdy projekt nie ma audio, wyświetlamy kartę z podpowiedzią następnego kroku.

W obu przypadkach pod głównym elementem znajduje się siatka (grid) z narzędziami projektu.

## Goals / Non-Goals

**Goals:**

- Przebudowa UI `index.tsx` na układ kafelkowy/dashboardowy.
- Wdrożenie logiki przełączającej widok w zależności od istnienia ścieżek audio.
- Wyświetlenie okładki zajmującej dokładnie 50% wysokości ekranu i 100% szerokości w stanie konsumpcji.
- Przeniesienie akcji "Edytuj projekt" i "Usuń projekt" do menu w nagłówku (headerRight).

**Non-Goals:**

- Zmiany w API backendu.
- Zmiany w strukturze bazy danych.
- Implementacja pełnego wgrywania okładek przez użytkownika (użyjemy placeholdera/mocka, jeśli `project.coverUrl` jest puste).

## Decisions

1. **Wykrywanie stanu audio**:
   - Użyjemy `Promise.all` w hooku `useFocusEffect`, aby pobrać równolegle `api.getProject(id)` oraz `api.getAudioTracks(id)`.
   - Jeśli `audioTracks.length > 0`, ustawiamy flagę `hasAudio = true`.

2. **Układ okładki (Edge-to-Edge, 50% wysokości)**:
   - Użyjemy `Dimensions.get('window')` do pobrania wysokości ekranu.
   - Kontener okładki otrzyma `height: height * 0.5` oraz `width: '100%'`.
   - Ponieważ `ScrollView` ma domyślnie padding, musimy usunąć padding z głównego kontenera `ScrollView` i aplikować go tylko do sekcji poniżej okładki, aby okładka dotykała krawędzi ekranu.
   - Przycisk odtwarzacza zostanie umieszczony na dole okładki za pomocą pozycjonowania absolutnego (`position: 'absolute', bottom: 24`).

3. **Menu kontekstowe (Zarządzanie)**:
   - Użyjemy `<Stack.Screen options={{ headerRight: () => ... }} />` z poziomu `index.tsx`, aby dodać ikonę "Ustawienia" lub "Więcej" (np. trzy kropki).
   - Kliknięcie w ikonę otworzy ActionSheet (iOS) lub Alert (Android) z opcjami "Edytuj projekt" i "Usuń projekt".

4. **Kafelki narzędzi**:
   - Użyjemy `flexDirection: 'row', flexWrap: 'wrap'` do stworzenia siatki 2-kolumnowej dla przycisków takich jak "Zdjęcia stron", "Głos i audio", "Udostępnij".

## Risks / Trade-offs

- **Ryzyko**: Pobieranie ścieżek audio przy każdym wejściu na ekran może delikatnie wydłużyć czas ładowania.
  - _Mitygacja_: Używamy `Promise.all`, więc czas ładowania będzie równy czasowi najwolniejszego żądania. W przyszłości można rozważyć dodanie flagi `hasAudio` bezpośrednio do modelu `Project`, ale na ten moment dodatkowe zapytanie jest akceptowalne.
- **Ryzyko**: Brak fizycznego pliku okładki.
  - _Mitygacja_: Jeśli `project.coverUrl` jest `null`, wyświetlimy estetyczny gradient z ikoną książki jako placeholder.
