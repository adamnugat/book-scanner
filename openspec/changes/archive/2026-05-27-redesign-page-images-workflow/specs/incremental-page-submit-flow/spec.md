## MODIFIED Requirements

### Requirement: Pojedynczy przycisk submitu w stopce ekranu zdjęć synchronizuje dodania, usunięcia i OCR

Ekran zdjęć projektu `apps/mobile/app/(app)/projects/[id]/images.tsx` SHALL udostępniać dokładnie jeden „submit" przycisk w środkowym slocie stopki `AudioFlowFooterMenu` (`createIcon='check'`), który po pojedynczym kliknięciu wykonuje pełną synchronizację stanu zdjęć z backendem oraz uruchamia sekwencję OCR→TTS dla wszystkich zdjęć po kolei, **bez nawigacji do osobnych ekranów Sceny OCR / Głos Lektora**. Po pomyślnym zakończeniu submit MUST przenieść użytkownika do widoku szczegółów audiobooka.

Przycisk MUST być wyłączony (`createDisabled`), gdy nie ma żadnych zmian (brak pendingów, brak nowych obrazów, brak usunięć od ostatniego submitu, brak zmiany kolejności).

#### Scenario: Użytkownik dodaje nowe zdjęcia i klika submit

- **WHEN** użytkownik dodaje co najmniej jedno zdjęcie z galerii lub aparatu i klika środkowy przycisk stopki
- **THEN** aplikacja MUST najpierw wysłać oczekujące pliki (`pendingAssets`) na backend
- **AND** MUST uruchomić OCR dla wszystkich zdjęć (na całym zdjęciu lub na zaznaczonych obszarach)
- **AND** po OCR (i ewentualnej korekcie) MUST uruchomić TTS dla wszystkich zdjęć
- **AND** po sukcesie MUST przenieść użytkownika do widoku szczegółów audiobooka

#### Scenario: Użytkownik usuwa zdjęcia i klika submit

- **WHEN** użytkownik usunął jedno lub więcej zdjęć od ostatniego submitu i klika środkowy przycisk stopki
- **THEN** backend MUST usunąć pliki obrazu, thumbnaila oraz wszystkie pliki audio powiązane z kaskadowo usuniętymi `AudioTrack` z S3
- **AND** aplikacja MUST kontynuować sekwencję OCR→TTS dla pozostałych zdjęć

#### Scenario: Submit jest disabled gdy nie ma żadnych zmian

- **WHEN** użytkownik nie dodał, nie usunął i nie przeporządkował żadnego zdjęcia od ostatniego submitu
- **THEN** środkowy przycisk stopki MUST być wyłączony

#### Scenario: Submit nie nawiguje do Scen OCR

- **WHEN** trwa lub kończy się sekwencja submitu
- **THEN** aplikacja NIE MUST nawigować do `/(app)/projects/[id]/scenes` ani `/(app)/projects/[id]/voice`

### Requirement: Submit pokazuje fazy postępu z komunikatem dla użytkownika

Podczas submitu ekran SHALL wyświetlać overlay (na bazie istniejącego `uploadOverlay` + `GlassPanel`) z jednoznacznym komunikatem fazy w języku polskim dla każdej operacji: upload, OCR oraz TTS. Brak fazy „cichej" — każda operacja sieciowa MUST mieć tekstową reprezentację dla użytkownika. Stan fazy MUST zostać zresetowany do `idle` przy ponownym wejściu na ekran (`useFocusEffect`).

#### Scenario: Faza uploadu

- **WHEN** trwa wysyłanie oczekujących plików
- **THEN** overlay MUST pokazywać tekst „Wysyłanie zdjęć…" i listę plików ze statusem (`pending`/`uploading`/`done`/`error`)

#### Scenario: Faza OCR

- **WHEN** upload zakończony i trwa rozpoznawanie tekstu
- **THEN** overlay MUST pokazywać tekst „Rozpoznawanie tekstu (OCR)…" i `ActivityIndicator`

#### Scenario: Faza TTS

- **WHEN** OCR (i ewentualna korekta) zakończone i trwa synteza mowy
- **THEN** overlay MUST pokazywać tekst „Generowanie audio (TTS)…" i `ActivityIndicator`

#### Scenario: Faza zakończenia

- **WHEN** TTS zakończy się pomyślnie dla wszystkich zdjęć
- **THEN** overlay MUST pokazać „Wszystkie zdjęcia zostały przetworzone" przed przejściem do szczegółów audiobooka

#### Scenario: Faza błędu

- **WHEN** którykolwiek z requestów (upload, OCR, TTS) zakończy się błędem
- **THEN** overlay MUST zostać zamknięty, użytkownik MUST pozostać na ekranie zdjęć
- **AND** aplikacja MUST wyświetlić toast lub `Alert` z opisem błędu (komunikat z backendu lub fallback)

## REMOVED Requirements

### Requirement: Submit przekazuje listę nowych scen do kroku korekty tekstu

**Reason**: Submit nie nawiguje już do ekranu Scen OCR — proces OCR→TTS przebiega inline na ekranie zdjęć, a po zakończeniu użytkownik trafia do szczegółów audiobooka. Parametr `newSceneIds` nie jest przekazywany do żadnego kroku korekty.
**Migration**: Patrz zdolność `page-images-workflow` — wymagania „Submit uruchamia sekwencję OCR→TTS bez zmiany widoku" i „Zakończenie procesu prowadzi do szczegółów audiobooka". Korekta tekstu odbywa się w modalu (`inline-ocr-correction-modal`).

### Requirement: Proces dodawania zdjęć jest dwukrokowy z jawną numeracją

**Reason**: Krok 2 staje się samodzielnym ekranem prowadzącym cały proces do gotowego audiobooka; nie ma już osobnego kroku „Sceny OCR" w nagłówku z numeracją 2/2.
**Migration**: Patrz `page-images-workflow` — wymaganie „Dynamiczny tytuł ekranu zdjęć" („Dodaj zdjęcia" / „Edytuj zdjęcia").

### Requirement: Krok korekty wyróżnia nowe sceny i prowadzi do Głosu Lektora

**Reason**: Nie ma osobnego kroku korekty scen ani przejścia do ekranu Głosu Lektora; TTS uruchamiany jest inline z poziomu ekranu zdjęć, a wybór lektora należy do Kroku 1.
**Migration**: Patrz `page-images-workflow` — wymagania „Przełącznik „korekta OCR" zatrzymuje proces po OCR", „Submit uruchamia sekwencję OCR→TTS bez zmiany widoku" oraz `inline-ocr-correction-modal`.
