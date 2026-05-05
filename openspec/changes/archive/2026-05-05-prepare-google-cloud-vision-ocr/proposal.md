## Why

OCR obecnie może działać w trybie mock albo przez nieudokumentowaną konfigurację Google Vision REST API, co powoduje, że aplikacja nadal zwraca przykładowy tekst mimo oczekiwania prawdziwego OCR. Potrzebna jest jednoznaczna integracja z Google Cloud Vision oparta o klucz service account JSON oraz czytelna instrukcja, gdzie umieścić poświadczenia bez zapisywania sekretów w repozytorium.

## What Changes

- Dodać pełną konfigurację backendu dla Google Cloud Vision OCR, w tym brakującą zależność runtime, wybór providera przez `OCR_PROVIDER=google` i walidację konfiguracji przy użyciu service account JSON.
- Zastąpić lub dostosować obecny provider Google OCR tak, aby korzystał z poświadczeń service account zamiast oczekiwać wyłącznie prostego `GOOGLE_CLOUD_API_KEY`.
- Udokumentować w `apps/api/.env.example`, że lokalny klucz JSON należy zapisać poza repozytorium i wskazać przez zmienną środowiskową, np. `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/google-vision-service-account.json`.
- Zapewnić jasny błąd konfiguracyjny, gdy `OCR_PROVIDER=google`, ale brakuje poświadczeń lub wymaganych pól service account.
- Zachować provider mock jako domyślny tryb lokalny/testowy, gdy Google OCR nie jest jawnie włączony.
- Non-goals: nie zmieniać limitów billingowych, autoryzacji użytkowników, uploadu obrazów, prywatnego dostępu do assetów, TTS ani logiki udostępniania projektów.

## Capabilities

### New Capabilities

- `google-cloud-vision-ocr`: opisuje wymagania dla produkcyjnego OCR przez Google Cloud Vision, konfiguracji poświadczeń i zachowania przy błędach integracji.

### Modified Capabilities

- Brak.

## Impact

- `apps/api`: provider OCR, konfiguracja środowiskowa, zależności `package.json`, testy integracji/mocking Google Vision.
- `packages/shared`: bez zmian oczekiwanych, o ile istniejące kontrakty odpowiedzi OCR wystarczą.
- `apps/mobile`: bez zmian oczekiwanych; aplikacja mobilna powinna nadal uruchamiać OCR przez istniejący endpoint i otrzymywać standardowe statusy/sceny.
- Systemy zewnętrzne: Google Cloud Vision API oraz lokalny/produkcyjny sposób dostarczenia poświadczeń service account.
- Weryfikacja: testy API dla providera OCR i konfiguracji, `npm run test:api`, `npm run lint`, opcjonalnie `npm run build:api`.
