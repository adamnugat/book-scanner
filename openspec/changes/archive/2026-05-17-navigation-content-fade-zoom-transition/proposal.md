## Why

Obecna animacja przejścia między widokami (slide) powoduje, że cały ekran przesuwa się jako jedna całość — łącznie z górnym paskiem nawigacyjnym i dolnym menu. Taki efekt nie wygląda naturalnie w kontekście stałych elementów layoutu, które nie powinny się poruszać przy zmianie treści. Zamiana na animację fade-in-out z zoomem wyłącznie dla obszaru treści doda głębi i nowoczesności bez zakłócania stabilności paska nagłówka i stopki.

## What Changes

- Animacja przejścia między widokami zmienia się z `slide` na `fade` z lekkim efektem zoom (scale).
- Animacja dotyczy **wyłącznie obszaru treści** (content area), nie całego ekranu.
- Górny pasek nawigacyjny (AudioFlow top header) oraz dolne menu nawigacyjne (AudioFlow footer) pozostają nieruchome podczas przejścia — nie skalują się i nie zanikają.
- Zmiana obejmuje zarówno przejścia „w przód" (push), jak i „wstecz" (pop).

## Capabilities

### New Capabilities

- `content-fade-zoom-transition`: Animacja przejścia widoku z efektem fade-in-out i skalowaniem, stosowana wyłącznie do obszaru treści (z wyłączeniem header i footer).

### Modified Capabilities

- `mobile-app-navigation`: Wymaganie dotyczące animacji przejścia między widokami — zamiast domyślnego slide używana jest animacja fade+zoom ograniczona do obszaru treści.

## Impact

- `apps/mobile`: konfiguracja expo-router / React Navigation Stack, prawdopodobnie customowy `screenOptions` lub wrapper dla `Stack.Screen`.
- Brak zmian w API, backendzie, schemacie Prisma ani packages/shared.
- Nie dotyczy: billing, sharing, OCR/TTS, storage, auth.
- Weryfikacja: `npm run test:mobile`, `npm run lint`.
