## Why

Użytkownik może poprawnie podejrzeć zdjęcie wybrane z galerii telefonu przed wysłaniem, ale po uploadzie lista stron nie potrafi wyrenderować miniatury i pokazuje komunikat „Nie można wyświetlić zdjęcia”. Problem jest szczególnie prawdopodobny dla zdjęć z iPhone w formacie HEIC, więc blokuje wiarygodny przepływ dodawania stron z galerii.

## What Changes

- Ustalić, czy upload zdjęć HEIC zachowuje oryginalny format, niepoprawny `contentType`, niedostępną miniaturę albo URL, którego klient Expo nie umie wyrenderować.
- Zapewnić, że zdjęcia wybrane z galerii, w tym HEIC z iPhone, po wysłaniu są widoczne na liście stron przez renderowalny `thumbnailUrl` albo fallback `imageUrl`.
- Jeśli backend przyjmuje HEIC, wygenerować klientowi kompatybilny podgląd/miniaturę w formacie obsługiwanym przez aplikację, bez upubliczniania prywatnych assetów.
- Jeśli klient mobilny powinien konwertować HEIC przed uploadem, zrobić to w istniejącym przepływie podglądu lokalnego i uploadu bez zmiany semantyki listy stron.
- Utrzymać obecne stany ładowania i błędu obrazu, ale sprawić, aby obsługiwany format nie trafiał w stan „Nie można wyświetlić zdjęcia”.
- Non-goals: brak zmian w billing/limitach planów, OCR/TTS providerach, udostępnianiu projektów, modelu autoryzacji oraz prywatności assetów. Brak migracji danych poza punktową aktualizacją metadanych/miniatur, jeśli okaże się konieczna.

## Capabilities

### New Capabilities

- Brak.

### Modified Capabilities

- `page-image-capture-preview`: Rozszerzenie wymagań o kompatybilne renderowanie zdjęć z galerii po uploadzie, w tym przypadków HEIC/iPhone, oraz o zachowanie prywatnego dostępu do wygenerowanych miniatur/podglądów.

## Impact

- Affected workspaces: `apps/mobile` dla picker/upload/preview UI oraz renderowania obrazów; `apps/api` dla walidacji MIME/magic bytes, generowania miniatur Sharp i odpowiedzi `PageImageResponse`, jeśli diagnoza potwierdzi problem po stronie backendu.
- Affected systems: upload zdjęć stron, tworzenie miniatur, tokenizowane endpointy assetów, content type obrazów, fallback `thumbnailUrl || imageUrl`, testy mobilne i ewentualne testy API dla HEIC.
- API shape powinien pozostać zgodny z obecnym `PageImageResponse`; preferowana jest zmiana treści/formatu assetu pod istniejącym URL-em zamiast dodawania pól kontraktu.
- Verification scope: testy mobilne dla galerii i renderowania po uploadzie, testy API dla uploadu/miniatur HEIC jeśli backend zostanie zmieniony, plus lint i format dla dotkniętych workspace'ów.
