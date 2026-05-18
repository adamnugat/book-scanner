## ADDED Requirements

### Requirement: Odtwarzanie audio inline na ekranie szczegółów projektu
Ekran szczegółów projektu SHALL umożliwiać odtwarzanie audiobooka bez przechodzenia do osobnego ekranu odtwarzacza. Panel `AudioFlowPlayerPanel` MUST inicjować i sterować odtwarzaniem za pomocą hooka `useAudioPlayer`.

#### Scenario: Pierwsze naciśnięcie play
- **WHEN** użytkownik naciśnie przycisk play na ekranie szczegółów projektu
- **THEN** system SHALL załadować playlist dla projektu, rozpocząć odtwarzanie pierwszego elementu i zmienić ikonę przycisku na ⏸

#### Scenario: Pauza odtwarzania
- **WHEN** użytkownik naciśnie przycisk odtwarzania podczas aktywnego odtwarzania
- **THEN** system SHALL wstrzymać odtwarzanie i zmienić ikonę przycisku na ▶

#### Scenario: Wznowienie odtwarzania
- **WHEN** użytkownik naciśnie przycisk odtwarzania podczas pauzy
- **THEN** system SHALL wznowić odtwarzanie od miejsca wstrzymania

---

### Requirement: Pasek postępu z dokładnym czasem odtwarzania
Panel odtwarzacza SHALL wyświetlać aktualną pozycję odtwarzania i całkowity czas bieżącego elementu w czasie rzeczywistym.

#### Scenario: Aktualizacja paska postępu podczas odtwarzania
- **WHEN** trwa odtwarzanie audio
- **THEN** pasek postępu SHALL przesuwać się proporcjonalnie do pozycji w bieżącym elementie playlist, a etykiety SHALL wyświetlać `MM:SS` dla `positionMs` i `durationMs`

#### Scenario: Pasek postępu przy braku audio
- **WHEN** projekt nie ma wygenerowanego audio
- **THEN** pasek postępu SHALL wyświetlać 0:00 / 0:00 i przycisk play SHALL być nieaktywny (disabled)

---

### Requirement: Nawigacja do poprzedniej i następnej strony (sceny)
Przyciski ‹‹ i ›› w panelu odtwarzacza SHALL nawigować do poprzedniej i następnej sceny w playliście (z pominięciem jingle'i interstitial).

#### Scenario: Przejście do następnej sceny
- **WHEN** użytkownik naciśnie przycisk „Następna strona" (››)
- **THEN** system SHALL załadować i odtworzyć kolejny element playlist o typie `scene`

#### Scenario: Przejście do poprzedniej sceny
- **WHEN** użytkownik naciśnie przycisk „Poprzednia strona" (‹‹)
- **THEN** system SHALL załadować i odtworzyć poprzedni element playlist o typie `scene`

#### Scenario: Brak następnej sceny
- **WHEN** użytkownik naciśnie „Następna strona" na ostatniej scenie
- **THEN** system SHALL nie zmieniać bieżącego elementu ani nie zgłaszać błędu

#### Scenario: Brak poprzedniej sceny
- **WHEN** użytkownik naciśnie „Poprzednia strona" na pierwszej scenie
- **THEN** system SHALL nie zmieniać bieżącego elementu ani nie zgłaszać błędu

---

### Requirement: Przewijanie o ±10 sekund
Panel odtwarzacza SHALL zawierać dwa przyciski umożliwiające przewinięcie odtwarzania o 10 sekund do przodu lub do tyłu.

#### Scenario: Przewinięcie do przodu o 10 s
- **WHEN** użytkownik naciśnie przycisk „+10 s"
- **THEN** system SHALL przesunąć pozycję odtwarzania o 10 000 ms do przodu, nie przekraczając `durationMs` bieżącego elementu

#### Scenario: Przewinięcie do tyłu o 10 s
- **WHEN** użytkownik naciśnie przycisk „−10 s"
- **THEN** system SHALL przesunąć pozycję odtwarzania o 10 000 ms do tyłu, nie schodząc poniżej 0

#### Scenario: Przewijanie przy braku załadowanego dźwięku
- **WHEN** użytkownik naciśnie skip przed naciśnięciem play
- **THEN** system SHALL zignorować akcję (no-op)

---

### Requirement: Przycisk „Zaawansowany odtwarzacz"
Pod panelem odtwarzacza inline SHALL znajdować się przycisk „Zaawansowany odtwarzacz" prowadzący do pełnego ekranu odtwarzacza.

#### Scenario: Nawigacja do pełnego odtwarzacza
- **WHEN** użytkownik naciśnie przycisk „Zaawansowany odtwarzacz"
- **THEN** system SHALL nawigować do `/(app)/projects/[id]/player` (dotychczasowy ekran odtwarzacza)

#### Scenario: Widoczność przycisku
- **WHEN** ekran szczegółów projektu jest wyrenderowany
- **THEN** przycisk „Zaawansowany odtwarzacz" SHALL być widoczny niezależnie od stanu odtwarzania

---

### Requirement: Hook `useAudioPlayer` jako reużywalna abstrakcja audio
Hook `useAudioPlayer(projectId)` SHALL enkapsulować całą logikę audio i być używany zarówno przez ekran szczegółów, jak i ekran pełnego odtwarzacza.

#### Scenario: Inicjalizacja hooka
- **WHEN** komponent wywołujący `useAudioPlayer(id)` zostaje zamontowany
- **THEN** hook SHALL załadować playlist (z uwzględnieniem jingle'i i offline cache) i ustawić `loading: false` po zakończeniu

#### Scenario: Czyszczenie zasobów audio
- **WHEN** komponent wywołujący hook zostaje odmontowany
- **THEN** hook SHALL wywołać `sound.unloadAsync()`, zapobiegając wyciekom pamięci
