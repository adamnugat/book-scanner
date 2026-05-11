## Context

Design system AudioFlow jest dostępny w `design-system/` jako tokeny (`tokens.json`, `tokens.css`), katalog komponentów (`Design System.html`) oraz widoki referencyjne (`design-system/reference-views/*.html`). Aplikacja mobilna Expo/React Native nie używa Tailwinda ani CSS custom properties w kodzie ekranów; obecnie większość stylów jest lokalna w `StyleSheet.create`.

Pierwszy etap powinien więc przetłumaczyć design system na idiomy React Native i zastosować go w ograniczonym flow kreatora. Docelowe referencje dla tego etapu to:
- `New Project.html` -> `apps/mobile/app/(app)/projects/new/index.tsx`
- `Add Photos.html` -> `apps/mobile/app/(app)/projects/new/images.tsx`

Pozostałe referencje (`Dashboard.html`, `Project Details.html`, `Page Photos.html`, `Voice and Audio.html`, `Share.html`, `Export.html`, `Login.html`) pozostają mapą dla kolejnych etapów, ale nie są częścią pierwszej implementacji.

## Goals / Non-Goals

**Goals:**
- Utworzyć wspólną warstwę AudioFlow dla React Native: tokeny kolorów, spacingu, radiusów, typografii i często używane style powierzchni.
- Zdefiniować małe prymitywy UI dla pierwszego zakresu, np. ekran z tłem, glass panel, pearl button, ghost button, picker card, top app bar i proste chipy/sekcje.
- Przerobić ekrany `New Project` i `Add Photos` tak, żeby wizualnie odpowiadały referencyjnym widokom HTML, zachowując obecne zachowanie i trasy.
- Utrzymać testowalność kreatora i ograniczyć zmianę do `apps/mobile`.

**Non-Goals:**
- Brak zmian w backendzie, OCR, TTS, uploadzie, storage, auth, sharing, billingach, limitach planów i kontraktach API.
- Brak pełnego redesignu dashboardu, detalu projektu, loginu, głosu/audio, zdjęć istniejącego projektu, udostępniania i eksportu w tej zmianie.
- Brak migracji aplikacji mobilnej na Tailwind/NativeWind.
- Brak wymogu idealnej zgodności efektów CSS niedostępnych natywnie w React Native, takich jak `backdrop-filter`; wdrożenie ma zachować percepcję glass/pearl w ramach możliwości platformy.

## Decisions

### 1. Adapter React Native zamiast bezpośredniego użycia Tailwinda

Utworzymy moduł w `apps/mobile` z tokenami i prymitywami UI. `design-system/tokens.json` pozostaje źródłem referencyjnym, ale runtime aplikacji korzysta z TypeScriptowych obiektów i komponentów.

Alternatywa: dodać NativeWind i przepisywać referencje jako klasy Tailwind. Odrzucamy to w pierwszym etapie, bo zwiększa zakres zależności i ryzyko konfiguracji, a obecny kod opiera się na `StyleSheet.create`.

### 2. Małe prymitywy zamiast dużego frameworka komponentów

Pierwszy zestaw powinien obejmować tylko elementy potrzebne do dwóch ekranów kreatora:
- `AudioFlowScreen` lub równoważny wrapper tła burgundy/ambient,
- `GlassPanel`,
- `PearlButton`,
- `GhostButton`,
- `PickerCard`,
- `TopAppBar`,
- pomocnicze style tekstu i ikon.

Alternatywa: zbudować pełną bibliotekę komponentów dla wszystkich widoków referencyjnych. Odrzucamy to, bo mogłoby opóźnić pierwszy ekran i wymusić abstrakcje, których użycie nie zostało jeszcze sprawdzone w kodzie produkcyjnym.

### 3. Reference views jako kontrakt kompozycyjny, nie kod do portowania 1:1

Widoki HTML określają hierarchię, rytm, nazwy sekcji, wygląd kart i priorytety CTA. Implementacja RN może różnić się detalami technicznymi, jeśli zachowuje user-visible layout i flow.

Przykłady adaptacji:
- `backdrop-filter: blur(3px)` tłumaczymy na półtransparentną powierzchnię z obramowaniem i inset highlight.
- `box-shadow` i glow mapujemy na `shadow*` tam, gdzie platforma to wspiera, oraz tonalny kontrast na Androidzie/web.
- Bottom nav z centralnym CTA z referencji kreatora może zostać wdrożony jako stały footer lub CTA w kontencie, jeśli zachowanie i dostępność są stabilniejsze w Expo Router.

### 4. Zachowanie kreatora ma być bez zmian

Ekran `New Project` nadal pobiera głosy i wstawki z API, waliduje tytuł oraz tworzy projekt. Ekran `Add Photos` nadal obsługuje galerię, aparat, listę zdjęć, tryb automatyczny i zaawansowany oraz istniejące wywołania OCR/TTS.

Alternatywa: przy okazji redesignu uprościć flow lub zmienić nawigację. Odrzucamy to, bo obecna zmiana ma być wizualno-systemowa, a logika kreatora została niedawno przebudowana.

### 5. Fonty i ikony jako ostrożne rozszerzenie

Design system wskazuje Quicksand, Varela Round i Material Symbols. Jeśli wdrożenie fontów okaże się konieczne, należy dodać je przez mechanizmy Expo i zapewnić sensowne fallbacki. Jeśli ikony Material Symbols zwiększą zakres zbyt mocno, pierwszy etap może użyć tekstowych/istniejących affordance'ów przy zachowaniu układu.

## Risks / Trade-offs

- React Native nie odwzoruje idealnie CSS glassmorphism → użyć tokenów powierzchni, obramowań, tonalnego kontrastu i cieni jako stabilnego odpowiednika.
- Zbyt duży zestaw komponentów na start → ograniczyć prymitywy do elementów faktycznie użytych przez dwa ekrany.
- Ryzyko regresji flow kreatora podczas refaktoru UI → utrzymać istniejące handler’y, API calls i testy, a zmieniać głównie strukturę prezentacyjną.
- Fonty zewnętrzne mogą dodać stan ładowania i wpływać na testy → dodać fallbacki i nie blokować działania aplikacji, jeśli font nie jest jeszcze gotowy.
- Referencje HTML zawierają elementy demo lub statyczne dane → implementacja musi używać realnych danych aplikacji, a nie kopiować przykładowych wartości.

## Migration Plan

1. Dodać warstwę tokenów/prymitywów AudioFlow w `apps/mobile` bez zmiany istniejących ekranów.
2. Przerobić `projects/new/index.tsx`, zachowując obecne pobieranie danych, walidację i nawigację.
3. Przerobić `projects/new/images.tsx`, zachowując obsługę galerii/aparatu, trybów i wywołań API.
4. Zaktualizować lub dodać testy mobilne dla kreatora, koncentrując się na zachowaniu i dostępności kluczowych akcji.
5. Zweryfikować wizualnie oba ekrany względem `New Project.html` i `Add Photos.html`.

Rollback jest prosty na poziomie kodu: zmiana nie dotyka bazy danych, API ani persisted state. W razie problemów można wycofać refaktor ekranów, zostawiając lub usuwając nieużywane prymitywy.

## Open Questions

- Czy w pierwszym etapie akceptujemy fallbacki systemowe dla Quicksand/Varela Round, jeśli dodanie fontów wydłuży wdrożenie?
- Czy centralny bottom CTA z referencji kreatora ma być obowiązkowy na wszystkich platformach, czy możemy użyć stabilniejszego footer CTA przy zachowaniu wyglądu pearl button?
