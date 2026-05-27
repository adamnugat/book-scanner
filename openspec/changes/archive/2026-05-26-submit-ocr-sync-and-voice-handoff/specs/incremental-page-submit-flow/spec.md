## ADDED Requirements

### Requirement: Pojedynczy przycisk submitu w stopce ekranu zdjęć synchronizuje dodania, usunięcia i OCR

Ekran zdjęć projektu `apps/mobile/app/(app)/projects/[id]/images.tsx` SHALL udostępniać dokładnie jeden „submit" przycisk w stopce `AudioFlowFooterMenu` (środkowy slot, `createIcon='check'`), który po pojedynczym kliknięciu wykonuje pełną synchronizację stanu zdjęć z backendem: upload zdjęć oczekujących, OCR dla nowo zsynchronizowanych obrazów, sprzątanie po usuniętych obrazach i przeniesienie użytkownika do kroku korekty tekstu (ekran „Sceny OCR").

Przycisk MUST być wyłączony (`createDisabled`), gdy nie ma żadnych zmian (brak pendingów, brak nowych obrazów, brak usunięć od ostatniego submitu, brak zmiany kolejności).

#### Scenario: Użytkownik dodaje nowe zdjęcia i klika submit

- **WHEN** użytkownik dodaje co najmniej jedno zdjęcie z galerii lub aparatu i klika środkowy przycisk stopki
- **THEN** aplikacja MUST najpierw wysłać oczekujące pliki (`pendingAssets`) na backend
- **AND** MUST wywołać `POST /projects/:projectId/process-ocr-batch` bez `force=true`
- **AND** MUST przenieść użytkownika do `/(app)/projects/[id]/scenes` (krok korekty tekstu) po pomyślnym zakończeniu obu operacji

#### Scenario: Użytkownik usuwa zdjęcia i klika submit

- **WHEN** użytkownik usunął jedno lub więcej zdjęć od ostatniego submitu i klika środkowy przycisk stopki
- **THEN** backend MUST usunąć pliki obrazu, thumbnaila oraz wszystkie pliki audio powiązane z kaskadowo usuniętymi `AudioTrack` z S3
- **AND** aplikacja MUST przenieść użytkownika do `/(app)/projects/[id]/scenes` po zakończeniu

#### Scenario: Submit jest disabled gdy nie ma żadnych zmian

- **WHEN** użytkownik nie dodał, nie usunął i nie przeporządkował żadnego zdjęcia od ostatniego submitu
- **THEN** środkowy przycisk stopki MUST być wyłączony

#### Scenario: Submit czeka na zakończenie OCR przed nawigacją

- **WHEN** trwa wywołanie `process-ocr-batch`
- **THEN** aplikacja MUST blokować nawigację do kroku korekty do momentu otrzymania odpowiedzi (sukces lub błąd)
- **AND** MUST wyświetlać overlay z aktualną fazą („Wysyłanie zdjęć", „Rozpoznawanie tekstu (OCR)")

### Requirement: Submit pokazuje fazy postępu z komunikatem dla użytkownika

Podczas submitu ekran SHALL wyświetlać overlay (na bazie istniejącego `uploadOverlay` + `GlassPanel`) z jednoznacznym komunikatem fazy w języku polskim. Brak fazy „cichej" — każda operacja sieciowa MUST mieć tekstową reprezentację dla użytkownika. Stan fazy (`submitPhase`) MUST zostać zresetowany do `idle` przy ponownym wejściu na ekran (`useFocusEffect`), aby overlay nie pozostał widoczny po powrocie z kroku korekty.

#### Scenario: Faza uploadu

- **WHEN** trwa wysyłanie oczekujących plików
- **THEN** overlay MUST pokazywać tekst „Wysyłanie zdjęć…" i listę plików ze statusem (`pending`/`uploading`/`done`/`error`)

#### Scenario: Faza OCR

- **WHEN** upload zakończony i trwa `process-ocr-batch`
- **THEN** overlay MUST pokazywać tekst „Rozpoznawanie tekstu (OCR)…" i `ActivityIndicator`

#### Scenario: Faza nawigacji

- **WHEN** OCR zakończony pomyślnie
- **THEN** overlay MUST pokrótce pokazać „Gotowe — otwieram korektę tekstu" przed wywołaniem `router.push`

#### Scenario: Overlay znika po powrocie z kroku korekty

- **WHEN** użytkownik wraca (`router.back`) z ekranu „Sceny OCR" na ekran zdjęć
- **THEN** overlay submitu MUST być niewidoczny (`submitPhase === 'idle'`)
- **AND** lista zdjęć MUST zostać odświeżona

#### Scenario: Faza błędu

- **WHEN** którykolwiek z requestów (`uploadImages`, `processOcrBatch`) zakończy się błędem
- **THEN** overlay MUST zostać zamknięty, użytkownik MUST pozostać na ekranie zdjęć
- **AND** aplikacja MUST wyświetlić toast lub `Alert` z opisem błędu (komunikat z backendu lub fallback „Nie udało się dokończyć synchronizacji")

### Requirement: Submit przekazuje listę nowych scen do kroku korekty tekstu

Po pomyślnym `process-ocr-batch` aplikacja SHALL obliczyć różnicę między listą scen sprzed submitu a listą scen po submicie i przekazać identyfikatory nowo utworzonych scen do widoku `scenes.tsx` przez parametr routingu `newSceneIds` (CSV). Nawigacja MUST używać `router.push` (nie `replace`), aby ekran zdjęć pozostał w stosie nawigacji i przycisk wstecz wracał do kroku 1.

#### Scenario: Nawigacja z listą nowych scen

- **WHEN** submit utworzył co najmniej jedną nową scenę
- **THEN** `router.push` MUST zostać wywołane z `pathname: '/(app)/projects/[id]/scenes'` i `params: { id, newSceneIds: 'id1,id2,…' }`

#### Scenario: Nawigacja bez nowych scen

- **WHEN** submit nie utworzył żadnej nowej sceny (tylko usunięcia lub reorder)
- **THEN** `router.push` MUST zostać wywołane z pustym ciągiem `newSceneIds`

### Requirement: Proces dodawania zdjęć jest dwukrokowy z jawną numeracją

Dodawanie zdjęć do istniejącego projektu SHALL być przedstawione jako dwukrokowy proces z numeracją w nagłówku każdego ekranu: krok 1 to „Zdjęcia stron", krok 2 to „Sceny OCR" (korekta tekstu). Tytuły MUST być skonfigurowane w `apps/mobile/app/(app)/_layout.tsx`.

#### Scenario: Tytuł kroku 1

- **WHEN** użytkownik jest na ekranie `projects/[id]/images`
- **THEN** nagłówek MUST pokazywać „Krok 1/2 · Zdjęcia stron"

#### Scenario: Tytuł kroku 2

- **WHEN** użytkownik jest na ekranie `projects/[id]/scenes`
- **THEN** nagłówek MUST pokazywać „Krok 2/2 · Sceny OCR"

#### Scenario: Przycisk wstecz z kroku 2 wraca do kroku 1

- **WHEN** użytkownik klika przycisk wstecz na ekranie „Sceny OCR" po dojściu tam przez submit
- **THEN** aplikacja MUST przenieść go z powrotem na ekran „Zdjęcia stron" (krok 1), a nie na widok szczegółów projektu

### Requirement: Krok korekty wyróżnia nowe sceny i prowadzi do Głosu Lektora

Ekran „Sceny OCR" (`apps/mobile/app/(app)/projects/[id]/scenes.tsx`) SHALL odczytać parametr routingu `newSceneIds` i wizualnie wyróżnić nowo zsynchronizowane sceny oraz udostępnić przycisk przejścia do widoku „Głos Lektora", przekazując tę samą listę `newSceneIds`.

#### Scenario: Wyróżnienie nowych scen

- **WHEN** ekran „Sceny OCR" otwarty z `newSceneIds` zawierającym identyfikatory scen
- **THEN** każda pasująca scena MUST być wizualnie wyróżniona (ramka akcentowa + oznaczenie „NOWA")

#### Scenario: Przejście do Głosu Lektora

- **WHEN** użytkownik klika przycisk „Przejdź do Głosu Lektora" na ekranie „Sceny OCR"
- **THEN** aplikacja MUST przenieść go do `/(app)/projects/[id]/voice` z parametrem `newSceneIds`
