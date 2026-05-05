## Context

Użytkownik opisuje miganie jako **obecne w całej aplikacji** i obejmujące **cały ekran w pionie** (nie tylko status bar ani navbar), przy czym **występuje tylko przy nawigacji wstecz** — nawigacja w przód nie jest zgłaszana jako problematyczna. To wskazuje na problem **globalny** związany z konfiguracją natywnego stacka lub kompozycją dwóch screenów w trakcie animacji **pop**. Typowa hipoteza: podczas `goBack` **równocześnie** komponowane są sąsiednie natywne screeny (`react-native-screens`); różnice tła lub treści między warstwami dają jednoklatkowy flash na **całym viewporcie**. Dokładna przyczyna wymaga profilowania na urządzeniu (szczególnie iOS), ale zakres zmian pozostaje w warstwie layoutu i opcji nawigacji, ze **spójnymi** ustawieniami dla `(app)` i `(auth)`.

## Goals / Non-Goals

**Goals:**

- Wyeliminować widoczne „miganie” / jednoklatkowe prześwietlenie **całego ekranu** przy standardowym `goBack` **we wszystkich częściach aplikacji** (auth, lista projektów, flow projektu, itd.).
- Zachować spójny wygląd podczas **cofania**: żaden fragment viewportera (nagłówek, treść, dół ekranu) nie powinien na ułamek sekundy pokazywać kontrastującej warstwy ani artefaktu kompozycji dwóch screenów.
- Ograniczyć zmiany do konfiguracji Expo Router / React Navigation i stylów już używanych w aplikacji (bez przebudowy całego UI).

**Non-Goals:**

- Zmiana logiki biznesowej, API, OCR, TTS, cache offline, auth, udostępniania ani rozliczeń.
- Wprowadzanie nowych bibliotek nawigacyjnych poza tym, co już dostarcza Expo SDK 54.
- Gwarancja identycznego zachowania na web, jeśli problem dotyczy wyłącznie natywnego stacka — priorytetem jest doświadczenie na iOS (zgodnie z raportem użytkownika).

## Decisions

1. **Diagnoza przed patchem** — Potwierdzić, że objaw dotyczy **wyłącznie cofania** (nie `push`). Na iOS (i ewentualnie Android) sprawdzić, czy miganie wiąże się z: domyślną animacją `Stack`, **nakładaniem się dwóch screenów** podczas gestu wstecz, przejściem `headerShown: false` ↔ nagłówek widoczny, `StatusBar` / `contentStyle` / `navigationBar` (Android), lub flagami typu `detachInactiveScreens`. Decyzja implementacyjna opiera się na obserwacji (np. React Native Debugger, wyłączenie animacji tymczasowo w celu izolacji), nie na zgadywaniu.

2. **Ujednolicenie tła stacka (wszystkie Stacki)** — Ustawić spójne `contentStyle` (lub równoważne w expo-router) dla **każdego** głównego `Stack` (`(app)` i `(auth)`), aby **cała scena** (nie tylko pas pod nagłówkiem) miała tło zgodne z motywem (`#1a1a2e` lub jawne tło root `View` ekranu), co redukuje białe lub domyślne przebłyski na **całym ekranie**, gdy sąsiednie widoki są widoczne jednocześnie podczas animacji **wstecz**.

3. **Status bar** — Utrzymać jeden spójny wariant w całej aplikacji (już `light` w root); unikać per-screen `StatusBar`, które mogłyby powodować jednoklatkową zmianę przy zmianie fokusu ekranu. Jeśli któryś ekran wymusza inny styl, rozważyć usunięcie lub przeniesienie ustawienia na poziom wyżej z jednym źródłem prawdy.

4. **Opcje ekranu indeksu (`headerShown: false`)** — Jeśli flash występuje przy przejściu z ekranu z nagłówkiem do listy projektów bez nagłówka (albo analogicznie login bez nagłówka → ekran z nagłówkiem w auth), rozważyć: (a) `animation` mniej agresywną lub spójną z iOS, (b) jednolity custom header także na ekranach bez systemowego nagłówka, (c) `freezeOnBlur` / `detachInactiveScreens` tylko jeśli potwierdzone jako przyczyna (świadoma zmiana — może wpływać na pamiść i odtwarzanie stanu).

5. **Kompozycja sąsiednich widoków** — Jeśli diagnoza potwierdzi artefakt „dwóch ekranów naraz”, preferować minimalne korekty (`contentStyle`, `sceneContainerStyle`, spójne `backgroundColor` na kontenerach) zanim sięga się po wyłączenie animacji lub hacki wizualne.

6. **Alternatywy odrzucone na start** — Całkowita migracja na inny navigator; wyłączenie animacji stacka globalnie (pogarsza UX); obejścia typu `opacity: 0` na całym stosie (maskuje objaw, nie źródło).

## Risks / Trade-offs

- [Ryzyko] Zmiana animacji lub tła może nieco zmienić odczuwalny „charakter” przejść na Androidzie → **Mitygacja:** test regresyjny na obu platformach; preferować minimalne diffy.
- [Ryzyko] Przyczyna może leżeć w bugfixie wersji `react-native-screens` / Expo → **Mitygacja:** dokumentować wersję SDK; ewentualnie śledzić znane issue; unikać skokowego bumpu wersji bez potrzeby.
- [Trade-off] Pełna spójność web vs native może nie być osiągalna jednym zestawem opcji → **Mitygacja:** rozdzielić `Platform.OS` tylko tam, gdzie konieczne.

## Migration Plan

- Wdrożenie przez zwykły deploy aplikacji mobilnej; brak migracji danych ani backendu.
- Rollback: revert commitu zmieniającego layout — brak skutków ubocznych dla użytkowników poza powrotem migania.

## Open Questions

- Czy miganie występuje także na Androidzie i w buildzie web, czy wyłącznie iOS — do potwierdzenia przy implementacji.
- Czy którykolwiek ekran ustawia własny `StatusBar` lub `SafeAreaView` z innym `backgroundColor` — wymaga przeglądu `apps/mobile/app` podczas implementacji.
- Czy objaw jest identyczny przy przycisku wstecz w nagłówku i przy geście edge-swipe (jeśli dotyczy iOS) — pomaga oddzielić problem animacji od problemu kompozycji warstw.
- Czy ekrany z `ScrollView` / listą mają jawne tło tylko na fragmencie treści (przezroczyste tło kontenera) — może powodować pełnoekranowy flash przy pop, mimo spójnego nagłówka.
