## Why

Obecna aplikacja mobilna ma rozproszony styl oparty o lokalne `StyleSheet.create`, a nowy design system AudioFlow istnieje już jako tokeny, katalog komponentów i referencyjne widoki HTML. Warto zacząć wdrożenie teraz, bo świeżo przebudowany kreator audiobooka jest dobrym, ograniczonym miejscem do ustanowienia wspólnych prymitywów UI przed redesignem kolejnych ekranów.

## What Changes

- Dodajemy mobilną warstwę design systemu dla Expo/React Native: tokeny, wspólne style i prymitywy odpowiadające AudioFlow glass/pearl.
- Przenosimy pierwszy zakres UI na nowy system: `New Project` oraz `Add Photos`, zgodnie z referencjami z `design-system/reference-views/`.
- Ustalamy mapowanie widoków referencyjnych na istniejące trasy aplikacji, ale implementujemy tylko pierwszy flow kreatora.
- Zachowujemy obecne zachowanie kreatora: tworzenie projektu, wybór języka, głosu, wstawki, dodawanie zdjęć oraz tryby automatyczny/zaawansowany.
- Nie zmieniamy kontraktów API, modeli danych, logiki OCR/TTS, storage, autoryzacji, udostępniania ani billingów.

## Capabilities

### New Capabilities
- `audioflow-mobile-design-system`: Wspólna warstwa tokenów i prymitywów React Native odzwierciedlająca design system AudioFlow.

### Modified Capabilities
- `audiobook-creation-wizard`: Kreator tworzenia audiobooka ma korzystać z nowej warstwy AudioFlow na ekranach konfiguracji projektu i dodawania zdjęć, bez zmiany działania flow.

## Impact

- **Affected workspaces:** `apps/mobile` oraz referencyjnie `design-system`.
- **Frontend:** nowe lub zaktualizowane pliki z tokenami/prymitywami UI w aplikacji mobilnej oraz refaktor `apps/mobile/app/(app)/projects/new/index.tsx` i `apps/mobile/app/(app)/projects/new/images.tsx`.
- **Backend/API:** brak zmian w endpointach, kontraktach request/response i procesach OCR/TTS.
- **Dependencies:** możliwe dodanie fontów Expo/Google lub ikon tylko jeśli będzie potrzebne do wiernego wdrożenia; preferowane jest ograniczenie zależności w pierwszym etapie.
- **Verification scope:** testy mobilne dla kreatora, lint aplikacji mobilnej oraz ręczna weryfikacja flow `New Project -> Add Photos` na podstawie widoków referencyjnych.
