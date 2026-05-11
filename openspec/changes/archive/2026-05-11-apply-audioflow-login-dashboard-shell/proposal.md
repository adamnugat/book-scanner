## Why

Ekran logowania, dashboard oraz stałe elementy nawigacyjne nadal korzystają ze starszego, granatowo-różowego stylu, przez co po wdrożeniu AudioFlow w kreatorze aplikacja ma niespójne pierwsze wrażenie i niespójny powrót do listy projektów. To naturalny kolejny etap, ponieważ fundament tokenów i prymitywów React Native już istnieje, a referencje `Login.html` i `Dashboard.html` opisują docelowy język wizualny dla wejścia do aplikacji i głównej biblioteki.

## What Changes

- Przebudowujemy ekran logowania według `design-system/reference-views/Login.html`: burgundy hero background, brand header AudioFlow, glass form card, pearl primary CTA, linki rejestracji i resetu hasła.
- Przebudowujemy dashboard/listę projektów według `design-system/reference-views/Dashboard.html`: wspólny header, sekcja powitalna, glass cards dla projektów, filtry/sortowanie w nowym stylu, puste i ładowane stany zgodne z AudioFlow.
- Rozszerzamy mobilną warstwę AudioFlow o wspólny app shell: top header oraz bottom footer menu z raised pearl CTA do tworzenia nowego audiobooka.
- Zachowujemy obecne zachowania: logowanie email/hasło, przejścia do rejestracji/resetu, pobieranie projektów, filtrowanie, sortowanie, usuwanie, logout, przejście do cennika i tworzenia projektu.
- Nie zmieniamy kontraktów API, modeli danych, logiki auth tokenów, OCR/TTS, storage, sharing ani billingów.

## Capabilities

### New Capabilities
- `audioflow-auth-ui`: Ekran logowania ma używać wizualnego języka AudioFlow przy zachowaniu istniejącego przepływu uwierzytelniania.

### Modified Capabilities
- `audioflow-mobile-design-system`: Warstwa React Native AudioFlow ma obejmować prymitywy i style potrzebne do wspólnego headera, footer menu, pól formularza, kart projektów i elementów statusu.
- `project-dashboard-ui`: Dashboard/lista projektów ma zostać przeniesiona na układ i stany wizualne AudioFlow bez zmiany zachowania listy.
- `mobile-app-navigation`: Główna część aplikacji ma korzystać ze spójnego top headera i bottom footer menu zgodnych z AudioFlow, bez zmiany semantyki tras.

## Impact

- **Affected workspaces:** `apps/mobile` oraz referencyjnie `design-system`.
- **Frontend:** refaktor `apps/mobile/app/(auth)/login.tsx`, `apps/mobile/app/(app)/index.tsx`, prawdopodobne zmiany w `apps/mobile/app/(app)/_layout.tsx`, `apps/mobile/app/(auth)/_layout.tsx` i `apps/mobile/components/audioflow.tsx`.
- **Tests:** aktualizacja lub dodanie testów mobilnych dla logowania, dashboardu, zachowania filtrów/sortowania, głównych CTA oraz dostępności header/footer menu.
- **Backend/API:** brak zmian w endpointach, kontraktach request/response, autoryzacji serwerowej, OCR/TTS, storage, sharing i billingach.
- **Dependencies:** bez nowych zależności, chyba że istniejący projekt wymaga minimalnego wsparcia dla fontów/ikon; preferowane jest wykorzystanie obecnych możliwości React Native/Expo i prostych symboli tekstowych.
- **Verification scope:** `npm run test:mobile`, lint dla aplikacji mobilnej lub najbliższy dostępny lint workspace oraz ręczna weryfikacja `Login.html` i `Dashboard.html` względem działających ekranów.
