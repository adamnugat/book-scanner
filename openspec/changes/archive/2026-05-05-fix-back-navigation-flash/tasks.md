## 1. Diagnoza i odtworzenie

- [x] 1.1 Na iOS (fizyczne urządzenie lub symulator) potwierdzić, że miganie występuje **tylko przy cofaniu** (nie przy `push`) i obejmuje **cały ekran**; odtworzyć w kilku miejscach (np. auth: rejestracja → wstecz; app: lista projektów ↔ projekt ↔ podstrona); sprawdzić przycisk wstecz vs gest (jeśli dostępny).
- [x] 1.2 Przeszukać `apps/mobile/app` pod kątem `SafeAreaView`, `headerTransparent`, `animation`, `contentStyle`, `detachInactiveScreens`, **przezroczystych lub brakujących teł** na root kontenerze ekranu oraz `ScrollView`/`FlatList` z jasnym lub domyślnym tłem — to może dawać pełnoekranowy flash przy `pop` mimo spójnego nagłówka.

## 2. Poprawka layoutu i stacka

- [x] 2.1 W `app/(app)/_layout.tsx` ustawić spójne tło dla całego `Stack` (np. `screenOptions.contentStyle` z kolorem zgodnym z `headerStyle.backgroundColor` — `#1a1a2e`) tak, aby **cała scena** miała wypełnione tło podczas animacji **cofnięcia**, oraz zweryfikować, czy eliminuje to pełnoekranowy przebłysk.
- [x] 2.2 W `app/(auth)/_layout.tsx` zastosować **te same zasady** co w `(app)` (co najmniej spójne `contentStyle` / tło sceny), aby nie naprawiać tylko jednej połowy aplikacji.
- [x] 2.3 Jeśli miganie występuje przy przejściu na ekran z `headerShown: false` (lista projektów lub login), rozważyć dostrojenie `animation` / jednolitego tła / minimalnej zmiany konfiguracji nagłówka zgodnie z ustaleniami z 1.1 — bez psucia istniejących tytułów i przycisku wstecz.
- [x] 2.4 Upewnić się, że `StatusBar` w `app/_layout.tsx` pozostaje jedynym źródłem stylu w aplikacji (obecnie brak per-screen — utrzymać).

## 3. Weryfikacja

- [x] 3.1 Ręcznie potwierdzić brak widocznego **pełnoekranowego** flashu przy **cofaniu** na iOS na ścieżkach z 1.1 (app + auth); potwierdzić, że **push** nie zregresował; krótko sprawdzić Android (lub web), żeby nie wprowadzić regresji.
- [x] 3.2 Uruchomić `npm run test:mobile` oraz `npm run lint` w repozytorium; naprawić ewentualne błędy wynikające ze zmian.
