## Context

Aktualny przepływ w `apps/mobile` pokazuje lokalny podgląd assetów z `expo-image-picker`, a po potwierdzeniu wysyła je przez istniejące API uploadu. Lista stron renderuje `thumbnailUrl || imageUrl` przez wspólny `PageImagePreview`, więc komunikat „Nie można wyświetlić zdjęcia” oznacza, że źródło zwrócone przez backend nie jest renderowalne przez klienta albo nie jest dostępne pod tokenizowanym URL-em.

Backend w `apps/api` deklaruje obsługę JPEG, PNG i HEIC, waliduje MIME/magic bytes, zapisuje oryginał w storage oraz próbuje wygenerować miniaturę WebP przez Sharp. Jeśli Sharp nie wygeneruje miniatury, backend obecnie kontynuuje bez niej, co dla HEIC może zostawić klienta z fallbackiem do oryginalnego pliku HEIC. Taki oryginał może być poprawnym uploadem, ale nie musi być renderowalny w React Native/Expo Web po pobraniu z protected endpointu.

## Goals / Non-Goals

**Goals:**

- Zapewnić, że zdjęcie HEIC wybrane z galerii i zaakceptowane przez upload ma po stronie listy stron renderowalny podgląd.
- Zachować prywatne, tokenizowane endpointy assetów oraz obecny kontrakt `PageImageResponse`.
- Zdiagnozować dokładną przyczynę: MIME z pickera, walidację magic bytes, generowanie miniatury, `contentType` endpointu assetu albo ograniczenia renderowania HEIC w kliencie.
- Dodać testy, które obejmują upload HEIC lub jego najbliższą możliwą reprezentację w środowisku testowym oraz fallback UI.

**Non-Goals:**

- Brak publicznych URL-i do obrazów i brak zmiany modelu autoryzacji.
- Brak zmian w OCR/TTS, playlistach, deep linkach, offline audio cache i billing.
- Brak migracji całego storage ani nowego dostawcy obrazów.
- Brak zmiany semantyki kolejności stron, usuwania, reorder lub dalszego przepływu OCR.

## Decisions

1. **Preferować renderowalną miniaturę serwerową jako źródło prawdy dla listy stron.**
   - Podejście: dla HEIC backend powinien zwracać `thumbnailUrl` do formatu obsługiwanego przez klienta, najlepiej WebP albo JPEG, tak jak dla pozostałych formatów. Oryginał może pozostać HEIC w storage, ale lista stron nie powinna zależeć od renderowania oryginału HEIC.
   - Rationale: lista stron ma pokazywać lekki podgląd, a backend już ma etap generowania miniatury i protected endpoint dla `thumbnail`.
   - Alternatives considered: konwersja HEIC wyłącznie w aplikacji mobilnej przed uploadem; może być potrzebna, jeśli Expo nie przekazuje stabilnego MIME/plików, ale duplikuje odpowiedzialność za format i nie pomaga uploadom z web drag-and-drop.

2. **Nie zmieniać `PageImageResponse`, dopóki istniejące pola wystarczają.**
   - Podejście: zachować `imageUrl`, `thumbnailUrl`, `mimeType` i istniejące metadane. Naprawa powinna sprawić, że `thumbnailUrl` jest obecny i renderowalny dla obsługiwanych uploadów.
   - Rationale: UI już wybiera `thumbnailUrl || imageUrl`; zmiana kontraktu byłaby większa niż potrzebny zakres i wymagałaby aktualizacji shared types.
   - Alternatives considered: dodać `displayUrl` albo `previewMimeType`; przydatne dopiero, gdy potrzeba wielu wariantów obrazu, czego ten błąd nie wymaga.

3. **Diagnoza HEIC ma obejmować oba końce uploadu.**
   - Podejście: w implementacji sprawdzić asset z `expo-image-picker` (`uri`, `fileName`, `mimeType`), multipart wysyłany przez `apps/mobile/lib/api.ts`, backendową walidację `SUPPORTED_IMAGE_TYPES` i `validateUploadContent`, a następnie `sharp(file.buffer)` oraz odpowiedź endpointu `/:imageId/thumbnail`.
   - Rationale: użytkownik widzi poprawny lokalny podgląd, więc źródło problemu pojawia się po uploadzie; bez sprawdzenia etapów łatwo naprawić tylko symptom.
   - Alternatives considered: od razu wymusić JPEG na kliencie; szybkie, ale może pogorszyć jakość/rozmiar i ominąć faktyczny błąd backendowej ścieżki HEIC.

4. **Dla nieobsługiwalnego HEIC wybrać jawne zachowanie zamiast cichego fallbacku do pustego obrazu.**
   - Podejście: jeśli HEIC jest akceptowany jako typ uploadu, musi powstać renderowalny podgląd; jeśli nie da się tego zapewnić w danym środowisku, upload powinien zwrócić czytelny błąd walidacji albo klient powinien skonwertować asset przed wysłaniem.
   - Rationale: zaakceptowany upload, który kończy się niewyświetlalną stroną, jest gorszy niż wczesny, zrozumiały błąd.

## Risks / Trade-offs

- [Risk] Sharp/libvips może nie obsługiwać HEIC w lokalnym albo produkcyjnym buildzie. → Mitigation: wykryć błąd generowania miniatury dla HEIC w testach/diagnostyce i wybrać klientową konwersję lub zmianę walidacji zamiast cichego braku miniatury.
- [Risk] Expo na iOS może zwracać `mimeType` jako `image/heic`, `image/heif` albo `null`. → Mitigation: mapować typ na podstawie `mimeType` i rozszerzenia tylko w wąskim helperze uploadu, z testami dla wariantów iPhone.
- [Risk] WebP miniatury mogą nie być najlepszym wspólnym formatem dla wszystkich targetów. → Mitigation: jeśli weryfikacja pokaże brak wsparcia w którymś targetcie, przełączyć miniatury stron na JPEG przy zachowaniu endpointu `thumbnail`.
- [Risk] Istniejące obrazy HEIC bez miniatur pozostaną niewyświetlalne. → Mitigation: po naprawie zapewnić odświeżenie/generowanie miniatur przy najbliższym odczycie tylko jeśli problem dotyczy już zapisanych danych; inaczej ograniczyć zmianę do nowych uploadów.

## Migration Plan

Brak planowanej migracji schematu bazy danych. Jeśli diagnoza potwierdzi istniejące rekordy HEIC bez miniatur, implementacja może dodać punktowy mechanizm ponownego wygenerowania miniatur lub ręczny task naprawczy, ale domyślny zakres obejmuje nowe uploady.

Rollback powinien polegać na przywróceniu poprzedniego zachowania uploadu/miniatur bez zmiany danych, ponieważ oryginalne pliki pozostają w storage pod tym samym modelem prywatnego dostępu.

## Open Questions

- Czy produkcyjne środowisko Sharp/libvips ma włączone wsparcie HEIC, czy tylko lokalna walidacja deklaruje ten format?
- Jakie dokładne wartości `mimeType`, `fileName` i rozszerzenia zwraca `expo-image-picker` dla zdjęć HEIC z iPhone w aktualnym środowisku testowym?
