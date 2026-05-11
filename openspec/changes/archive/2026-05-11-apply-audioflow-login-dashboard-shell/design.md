## Context

Pierwszy etap AudioFlow wdrożył `apps/mobile/components/audioflow.tsx` z tokenami, tłem, glass panelami, pearl/ghost buttonami, picker cards, chipami i prostym `TopAppBar`. Użycie tych prymitywów jest już sprawdzone na ekranach `New Project` i `Add Photos`, a `audioFlowReferenceViews` mapuje także `/(auth)/login` na `Login.html` oraz `/(app)` na `Dashboard.html`.

Obecne ekrany logowania i dashboardu nadal mają lokalne style (`#1a1a2e`, `#e94560`, lokalne karty i przyciski). Dashboard `apps/mobile/app/(app)/index.tsx` ma realną logikę produktu: pobiera projekty, filtruje, sortuje, obsługuje puste stany, usuwanie, logout, pricing i tworzenie projektu. Login `apps/mobile/app/(auth)/login.tsx` obsługuje email/hasło, walidację pustych pól, stan ładowania, błędy, `router.replace('/(app)')` oraz linki rejestracji/resetu.

Zmiana dotyczy warstwy mobilnej. Nie wymaga zmian backendu, modeli Prisma, kontraktów API, tokenów auth, offline cache, deep linków, OCR/TTS, storage, sharing ani billingów.

## Goals / Non-Goals

**Goals:**
- Rozszerzyć istniejący moduł AudioFlow o prymitywy potrzebne dla app shell: brand header, icon/round button, bottom footer menu, form field, divider, project card/status pill i ewentualny mini panel ostatniego odtwarzania jako komponent prezentacyjny.
- Przenieść `/(auth)/login` na układ z `Login.html`, zachowując istniejące pola, walidację, loading, błędy i linki auth.
- Przenieść `/(app)` na układ z `Dashboard.html`, używając realnych danych projektów zamiast statycznych wartości referencyjnych.
- Dodać spójny footer menu w głównej części aplikacji z aktywną biblioteką, centralnym CTA do `/(app)/projects/new` i trzecią pozycją prowadzącą do stabilnego istniejącego miejsca, bez wprowadzania fikcyjnych tras.
- Zaktualizować testy mobilne tak, żeby sprawdzały zachowanie, role/accessibility labels i kluczowe CTA po refaktorze wizualnym.

**Non-Goals:**
- Brak przebudowy rejestracji, resetu hasła, pricingu, szczegółów projektu, odtwarzacza, share/export i pozostałych widoków referencyjnych.
- Brak dodawania logowania Google/Apple z referencji HTML, ponieważ produkt ma obecnie email/hasło i backend nie obsługuje social auth.
- Brak zmian w semantyce tras Expo Router, autoryzacji serwerowej, refresh tokenach, limitach planów lub request/response contracts.
- Brak wymogu pixel-perfect CSS efektów takich jak `backdrop-filter`, gradient text czy web-only hover; React Native ma zachować percepcję AudioFlow przez tokeny, glass surfaces, pearl accent, cienie i spacing.

## Decisions

### 1. Rozszerzamy `components/audioflow.tsx` zamiast tworzyć równoległy UI kit

Nowe elementy powinny mieszkać przy istniejących tokenach i prymitywach AudioFlow. Dzięki temu login, kreator i dashboard korzystają z jednej warstwy stylu, a kolejne ekrany mogą stopniowo przejmować te same elementy.

Alternatywa: osobne komponenty tylko dla dashboardu i loginu. Odrzucamy ją, bo powieliłaby style glass/pearl i utrudniła spójne wdrożenie header/footer menu.

### 2. App shell jako komponent ekranowy, nie globalna przebudowa wszystkich stacków

Footer menu i brand header należy zastosować przede wszystkim na dashboardzie oraz jako prymityw do użycia w kolejnych ekranach. Layout stacków może dalej ukrywać natywne headery tam, gdzie ekran ma własny AudioFlow header. Nie trzeba od razu wymuszać bottom nav na wszystkich podtrasach projektu, bo mogłoby to kolidować z przepływami kreatora i ekranami edycji.

Alternatywa: przebudować root layout i każdy ekran w `(app)` pod globalny shell. Odrzucamy to w tej zmianie, bo zakres użytkownika dotyczy loginu, dashboardu oraz wspólnego header/footer menu, a pełna migracja wszystkich tras zwiększyłaby ryzyko regresji.

### 3. Dashboard używa realnych projektów, a nie statycznej narracji referencji

`Dashboard.html` pokazuje przykładowe statystyki i ostatnio odtwarzany element. Implementacja ma zachować realne dane aplikacji: liczba projektów może wynikać z `projects.length`, a lista kart ma używać `ProjectResponse`. Jeśli brakuje danych do czasu słuchania lub ostatnio odtwarzanego audiobooka, nie dodajemy fikcyjnych metryk; można użyć krótkiej sekcji powitalnej i istniejących projektów jako głównej treści.

Alternatywa: zakodować demo wartości z HTML. Odrzucamy ją, bo dashboard musi odzwierciedlać stan użytkownika.

### 4. Login adaptuje visual design, ale nie rozszerza auth capabilities

Social buttons z `Login.html` nie powinny być aktywne ani widoczne jako działająca funkcja, dopóki backend i product scope ich nie obsługują. Główna karta powinna zawierać email, hasło, pearl CTA, link resetu i link rejestracji. Brand copy może być zlokalizowane po polsku, spójnie z resztą aplikacji.

Alternatywa: dodać nieaktywne Google/Apple buttons jako dekorację. Odrzucamy ją, bo tworzyłaby fałszywe affordance'y.

### 5. Footer menu ma używać istniejących tras

Centralny raised pearl CTA prowadzi do `/(app)/projects/new`. Pozycja biblioteki prowadzi do `/(app)`. Trzecia pozycja powinna prowadzić do istniejącego, stabilnego miejsca lub być pokazana tylko wtedy, gdy mamy sensowny cel, np. ostatnio otwarty/wybrany projekt. W pierwszej implementacji preferowany jest prosty, testowalny shell na dashboardzie: aktywna Biblioteka, CTA Nowy, opcjonalna pozycja Player jako disabled/secondary tylko jeśli nie ma konkretnego projektu.

Alternatywa: prowadzić "Odtwarzacz" do statycznej ścieżki z referencji. Odrzucamy ją, bo aplikacja wymaga `projectId` dla playera.

## Risks / Trade-offs

- React Native nie odwzoruje pełnego `backdrop-filter` i webowych gradientów → użyć istniejących glass tokenów, borderów, cieni i tonalnego kontrastu; udokumentować intencjonalne różnice wizualne w zadaniach.
- Globalne footer menu może zasłaniać listę lub FAB → dodać dolny padding zależny od safe area i usunąć/zmienić lokalny FAB, żeby jeden primary CTA nie konkurował z drugim.
- Header actions mogą zmienić dostępność logout/pricing → zachować widoczne lub jasno dostępne akcje, najlepiej jako glass/ghost controls lub menu action sheet z testowalnymi labelami.
- Przeróbka dashboardu może złamać testy oparte na tekstach/przyciskach → aktualizować testy wokół zachowania, nie wokół szczegółów stylu.
- Login z nowym layoutem może ukryć Alert/disabled loading state → zachować dotychczasowy `loading`, disabled state, `ActivityIndicator` i walidację pustych pól.

## Migration Plan

1. Rozszerzyć `components/audioflow.tsx` o brakujące prymitywy app shell/form/dashboard bez zmiany istniejących ekranów kreatora.
2. Przebudować `apps/mobile/app/(auth)/login.tsx`, zachowując handler `handleLogin`, linki i teksty błędów.
3. Przebudować `apps/mobile/app/(app)/index.tsx`, zachowując `loadProjects`, `filter`, `sortKey`, `handleDelete`, `logout` i trasy.
4. Dopasować layouty `(auth)` i `(app)` tylko w zakresie tła/headery, jeśli jest to potrzebne do uniknięcia domyślnego granatowego stacka lub flashu.
5. Zaktualizować testy mobilne i ręcznie porównać `Login.html` oraz `Dashboard.html`.

Rollback jest prosty: zmiana nie migruje danych ani API. W razie problemów można wycofać refaktory ekranów i pozostawić niewykorzystane prymitywy do późniejszego usunięcia.

## Open Questions

- Czy trzecia pozycja footer menu ma być ukryta/nieaktywna bez aktywnego projektu, czy ma prowadzić do ostatniego projektu, jeśli da się go jednoznacznie wybrać z listy?
- Czy logout i pricing powinny pozostać widocznymi przyciskami w headerze dashboardu, czy zostać przeniesione do menu `more` zgodnego z referencją?
