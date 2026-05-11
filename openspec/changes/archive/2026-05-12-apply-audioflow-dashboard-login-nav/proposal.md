## Why

Wdrażamy kolejny etap nowego systemu wizualnego (AudioFlow) w aplikacji mobilnej. Zmiana ma na celu ujednolicenie interfejsu użytkownika na kluczowych ekranach: logowania, dashboardu oraz szczegółów projektu, a także wprowadzenie spójnej globalnej nawigacji (header i footer). Dodatkowo, upraszczamy dashboard, usuwając zbędne filtry i sortowania na rzecz szybkiego dostępu do ostatnio odtwarzanego audiobooka.

## What Changes

- **Ekran logowania**: Wdrożenie nowego designu z `design-system/reference-views/Login.html`.
- **Dashboard**: Wdrożenie nowego designu z `design-system/reference-views/Dashboard.html`. Usunięcie filtrów i sortowania z sekcji "Twoje projekty". Dodanie widżetu ostatnio odtwarzanego audiobooka z przyciskiem play i paskiem postępu.
- **Nawigacja**: Wdrożenie spójnego górnego menu (header) oraz dolnego menu (footer) w całej aplikacji zgodnie z nowym design systemem.
- **Szczegóły projektu**: Wdrożenie nowego widoku szczegółów projektu (Project details) z naciskiem na górny kontener z odtwarzaczem.
- Brak zmian w logice API, OCR, TTS oraz uwierzytelniania.

## Capabilities

### New Capabilities
<!-- Brak nowych capabilities -->

### Modified Capabilities
- `project-dashboard-ui`: Przebudowa dashboardu, usunięcie filtrów, dodanie sekcji ostatnio odtwarzanego audiobooka.


## Impact

- `apps/mobile/app/(auth)/login.tsx` (lub odpowiednik)
- `apps/mobile/app/(app)/index.tsx` (Dashboard)
- `apps/mobile/app/(app)/projects/[id]/index.tsx` (Project details)
- Komponenty nawigacyjne w `apps/mobile/components/` (header, footer)
- System layoutów w `apps/mobile/app/(app)/_layout.tsx`
