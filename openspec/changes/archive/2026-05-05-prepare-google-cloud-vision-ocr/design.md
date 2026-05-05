## Context

Backend ma już abstrakcję `apps/api/src/lib/ocr.ts`, która wybiera providera przez `OCR_PROVIDER`. Gdy provider nie jest ustawiony na `google`, zwracany jest mock z przykładowym tekstem, co tłumaczy obserwowane wyniki OCR. Obecny kod Google korzysta z bezpośredniego REST calla i `GOOGLE_CLOUD_API_KEY`, natomiast użytkownik posiada standardowy klucz service account JSON dla Google Cloud Vision.

Klucz JSON jest sekretem i nie może trafić do repozytorium. Lokalnie powinien zostać zapisany poza katalogiem projektu albo w ignorowanej lokalizacji, a backend powinien dostać ścieżkę przez zmienną środowiskową. W produkcji poświadczenia powinny być dostarczone przez secret manager, mounted secret albo zmienne środowiskowe platformy.

## Goals / Non-Goals

**Goals:**

- Użyć oficjalnej biblioteki Google Cloud Vision w `apps/api` i dodać ją do `apps/api/package.json`.
- Obsłużyć `OCR_PROVIDER=google` przez service account JSON zgodny z Google Application Default Credentials.
- Udokumentować konfigurację w `apps/api/.env.example` bez ujawniania prawdziwych sekretów.
- Zapewnić jasne błędy, gdy Google OCR jest włączony, ale konfiguracja jest niekompletna lub poświadczenia są niepoprawne.
- Zachować istniejący model asynchronicznego OCR i kształt odpowiedzi API.

**Non-Goals:**

- Brak zmian w modelu danych Prisma i kontraktach odpowiedzi mobilnych, o ile obecne statusy i pola wystarczają.
- Brak zmian w autoryzacji, prywatnym dostępie do obrazów, uploadzie zdjęć, TTS, billingach i limitach planów.
- Brak zapisywania service account JSON w repozytorium, `package.json`, `apps/api/.env.example` lub logach.

## Decisions

1. **Użyć `@google-cloud/vision` zamiast ręcznego REST calla.**

   Oficjalny klient obsługuje Application Default Credentials, format service account JSON, odnawianie tokenów i typowe błędy autoryzacji. Alternatywa, czyli dalsze używanie `fetch` z API key, nie pasuje do dostarczonego klucza JSON i wymagałaby ręcznej obsługi autoryzacji OAuth.

2. **Preferować `GOOGLE_APPLICATION_CREDENTIALS` jako podstawową konfigurację lokalną.**

   Najprostsza i zgodna z Google ścieżka to zapisanie pliku JSON poza repozytorium, np. `~/secrets/book-scanner-google-vision.json`, oraz ustawienie w `apps/api/.env`:

   ```env
   OCR_PROVIDER=google
   GOOGLE_APPLICATION_CREDENTIALS=/Users/<user>/secrets/book-scanner-google-vision.json
   ```

   W tym wariancie nie trzeba przepisywać pojedynczych pól JSON do `.env`; backend odczytuje cały plik przez bibliotekę Google.

3. **Dopuścić opcjonalny wariant bez pliku tylko dla środowisk deploymentowych.**

   Jeżeli platforma nie pozwala montować pliku, backend może obsłużyć zmienną zawierającą JSON lub pola `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_CLIENT_EMAIL` i `GOOGLE_CLOUD_PRIVATE_KEY`. Minimalnie potrzebne dane z klucza service account to `project_id`, `client_email` i `private_key`; pozostałe pola są częścią standardowego pliku i powinny pozostać w pliku JSON, gdy używany jest `GOOGLE_APPLICATION_CREDENTIALS`.

4. **Nie zmieniać domyślnego mock providera.**

   Testy i lokalny onboarding bez Google Cloud powinny nadal działać. Realny OCR uruchamia się tylko po jawnym ustawieniu `OCR_PROVIDER=google`.

5. **Mapować regiony tekstu po stronie obecnej abstrakcji.**

   Provider Google powinien nadal zwracać tekst zgodny z `OcrResult`. Jeżeli regiony są podane, można używać `DOCUMENT_TEXT_DETECTION` i istniejącej logiki filtrowania tekstu po bounding boxach, bez zmiany endpointów.

## Risks / Trade-offs

- [Błędna ścieżka do JSON] → Przy starcie lub pierwszym wywołaniu Google OCR zwracać czytelny błąd konfiguracji z nazwą brakującej zmiennej, ale bez wypisywania sekretu.
- [Prywatny klucz w `.env` z uszkodzonymi znakami nowej linii] → Preferować ścieżkę `GOOGLE_APPLICATION_CREDENTIALS`; wariant inline musi normalizować `\\n` do prawdziwych nowych linii.
- [Koszty Google Cloud Vision] → Realny provider działa tylko po `OCR_PROVIDER=google`; testy powinny mockować klienta i nie wykonywać płatnych requestów.
- [Różnice wyników między `TEXT_DETECTION` i `DOCUMENT_TEXT_DETECTION`] → Dla stron książek preferować `DOCUMENT_TEXT_DETECTION`, szczególnie gdy są regiony tekstu lub wiele akapitów.
- [Brak kompatybilności z istniejącym mockiem] → Zachować `OcrResult` oraz dotychczasowe statusy scen, aby mobile nie wymagało zmian.

## Migration Plan

1. Dodać zależność `@google-cloud/vision` do `apps/api`.
2. Przepiąć `recognizeWithGoogle` na `ImageAnnotatorClient`, z konfiguracją opartą o `GOOGLE_APPLICATION_CREDENTIALS` i opcjonalny inline fallback dla deploymentu.
3. Zaktualizować `apps/api/.env.example` komentarzami, bez prawdziwego klucza.
4. Dodać testy API/lib OCR mockujące klienta Google i przypadki braku konfiguracji.
5. Zweryfikować `npm run test:api`, `npm run lint` i `npm run build:api`.

Rollback polega na ustawieniu `OCR_PROVIDER=mock` albo usunięciu konfiguracji Google; istniejące dane projektów i scen nie wymagają migracji.

## Open Questions

- Czy środowisko produkcyjne będzie mogło zamontować plik JSON, czy wymaga trzymania sekretu jako pojedynczej zmiennej środowiskowej?
- Czy docelowo OCR ma używać zawsze `DOCUMENT_TEXT_DETECTION` dla zdjęć stron, czy tylko wtedy, gdy użytkownik zaznaczy regiony?
