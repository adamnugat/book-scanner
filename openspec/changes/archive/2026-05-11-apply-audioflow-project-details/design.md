## Context

AudioFlow jest już wdrożony w kreatorze nowego audiobooka, ekranach logowania/dashboardu oraz w prymitywach `apps/mobile/components/audioflow.tsx`. Widok `apps/mobile/app/(app)/projects/[id]/index.tsx` nadal zawiera wcześniejszy redesign szczegółów projektu: granatowe tło, lokalne style, prosty hero cover z przyciskiem "Odtwarzaj audiobooka" i kafelki narzędzi.

Referencja `design-system/reference-views/Project Details.html` definiuje docelowy kierunek: górna połowa ekranu jako pełnoekranowy kontener okładki z gradientowym overlayem, statusem, tytułem, metadanymi oraz szklanym panelem odtwarzacza. Pod nim znajduje się siatka narzędzi projektu i persistent footer menu. Obecny kod ma już ważne zachowania, które trzeba zachować: `api.getProject(id)`, `api.getAudioTracks(id)`, rozróżnienie projektu z audio/bez audio, menu edycji/usuwania oraz nawigację do istniejących tras projektu.

Zmiana dotyczy wyłącznie `apps/mobile`. Nie ma wpływu na API, modele Prisma, kontrakty shared, auth, OCR/TTS, storage, offline cache ani deep linki.

## Goals / Non-Goals

**Goals:**

- Przenieść ekran szczegółów projektu na AudioFlow visual language z burgundy ambient background, glass surfaces, pearl accent, glow typography i bottom footer menu.
- Zaakcentować górny kontener z odtwarzaczem jako najważniejszy element ekranu dla projektów z wygenerowanym audio.
- Rozszerzyć `components/audioflow.tsx` o małe, reusable prymitywy potrzebne dla Project Details, bez tworzenia równoległego UI kitu.
- Zachować istniejące pobieranie danych, detekcję `hasAudio`, menu edycji/usuwania oraz routing do zdjęć, głosu/audio, udostępniania i pełnego odtwarzacza.
- Zaktualizować testy mobilne wokół zachowania i dostępności, a nie pikselowych szczegółów layoutu.

**Non-Goals:**

- Brak zmian w backendzie, OCR, TTS, auth, billingach, storage, sharing contracts, offline cache i persisted data.
- Brak przebudowy pełnego ekranu `/(app)/projects/[id]/player`; ta zmiana może linkować do niego, ale nie musi przenosić całej logiki audio do detalu projektu.
- Brak dodawania nowych pól do `ProjectResponse`, np. liczby stron, czasu odsłuchu lub autora. UI ma używać istniejących danych lub neutralnych etykiet.
- Brak wdrażania nowych ikon/fontów jako obowiązkowej zależności; symbole tekstowe lub istniejące affordance'y są akceptowalne, jeśli zachowują AudioFlow hierarchy.

## Decisions

### 1. Hero-player jako kompozycja prezentacyjna na ekranie szczegółów

Górny kontener powinien składać się z:

- AudioFlow top app bar z back i more actions;
- cover/placeholder art z overlayem dla czytelności;
- status pill i metadanych opartych o dostępne dane projektu oraz `audioTracks`;
- tytułu projektu, języka i wybranych ustawień głosu/wstawki, jeśli są dostępne;
- glass player panelu z paskiem postępu, czasami i kontrolkami transportu.

Kontrolki w hero-playerze powinny być dostępne jako przyciski. W pierwszej implementacji centralny play oraz pomocnicze kontrolki mogą prowadzić do `/(app)/projects/${id}/player`, zamiast duplikować `expo-av`, playlistę, offline cache i scene-aware navigation w detalu projektu.

Alternatywa: osadzić pełny player z `expo-av` bezpośrednio w Project Details. Odrzucamy ją w tej zmianie, bo istniejący `player.tsx` zawiera osobny stan audio, playlisty, offline cache i sceny; duplikacja zwiększyłaby ryzyko regresji poza zakresem visual system rollout.

### 2. Stan bez audio pozostaje workflow card, ale w AudioFlow

Jeśli `api.getAudioTracks(id)` zwraca pustą listę, ekran nie powinien udawać gotowego playera. Zamiast tego renderuje górny AudioFlow panel z tytułem projektu, statusem i następnym krokiem:

- dla `ready_for_tts`: CTA do `voice`;
- dla pozostałych statusów: instrukcja zakończenia OCR i zatwierdzenia tekstu.

Alternatywa: zawsze pokazywać player panel w disabled state. Odrzucamy ją, bo mogłaby sugerować, że audio istnieje, i osłabiłaby aktualną logikę etapów projektu.

### 3. Prymitywy rozszerzamy tylko pod realne użycie

`apps/mobile/components/audioflow.tsx` może dostać małe komponenty lub style:

- `AudioFlowProjectHero` albo zestaw mniejszych helperów dla cover/overlay/status/player;
- `AudioFlowProgressBar`;
- `ProjectToolTile`;
- rozszerzenie footer menu, żeby `active="player"` działało naturalnie na detalu projektu.

Nie trzeba tworzyć kompletnego systemu ikon, globalnego player store ani abstrakcji dla wszystkich przyszłych widoków. Jeśli komponent zaczyna przyjmować zbyt wiele danych domenowych, lepiej zostawić domenową kompozycję w ekranie i współdzielić tylko prezentacyjne części.

Alternatywa: wszystko zaimplementować lokalnie w `index.tsx`. Odrzucamy ją, bo górny player i tool tiles będą prawdopodobnie potrzebne także przy kolejnych referencjach AudioFlow.

### 4. Dane referencyjne nie zastępują danych produktu

`Project Details.html` zawiera wartości demo, np. liczbę stron i czas trwania. Implementacja nie powinna dodawać fikcyjnych metryk. Można obliczyć łączny czas z `audioTracks.durationMs`, pokazać liczbę ścieżek audio albo użyć neutralnych etykiet, jeśli dane nie istnieją w `ProjectResponse`.

Alternatywa: hardcodować teksty z referencji dla lepszej zgodności wizualnej. Odrzucamy ją, bo ekran ma pokazywać realny stan prywatnego projektu użytkownika.

### 5. App shell pozostaje zgodny z istniejącymi trasami

Footer menu na detalu projektu powinno mieć aktywny "Odtwarzacz" i centralny CTA do tworzenia nowego audiobooka. Biblioteka prowadzi do `/(app)`, a aktywna pozycja player może pozostawać na bieżącym ekranie albo prowadzić do pełnego `player`, jeśli projekt ma audio.

Alternatywa: przenieść bottom nav globalnie na cały `(app)` stack. Odrzucamy ją w tej zmianie, bo mogłoby to naruszyć kreator i ekrany edycyjne, a użytkownik wskazał konkretnie Project Details.

## Risks / Trade-offs

- Hero-player bez pełnego `expo-av` może nie odtwarzać audio inline → Mitigation: centralne CTA i kontrolki jasno otwierają istniejący pełny odtwarzacz; spec wymaga zachowania nawigacji, nie przebudowy silnika audio.
- Brak liczby stron w `ProjectResponse` może osłabić zgodność z referencją → Mitigation: użyć dostępnych danych (`status`, język, liczba ścieżek, sumaryczny czas audio) i nie dodawać API.
- Rozbudowany top container może kolidować ze safe area i nagłówkiem Expo Router → Mitigation: ukryć lub uczynić transparentny natywny header, a własny AudioFlow top bar umieścić w kontenerze z bezpiecznym paddingiem.
- Footer menu może zasłaniać dolne kafelki → Mitigation: dodać dolny padding `ScrollView` zależny od footer height i safe area.
- Testy mogą zależeć od starych tekstów, np. "Odtwarzaj audiobooka" → Mitigation: zaktualizować je na dostępne labelki i zachowania: widoczny hero-player, CTA do `player`, TTS next step i opcje projektu.

## Migration Plan

1. Rozszerzyć `audioflow.tsx` o brakujące prymitywy dla hero-playera i tool tiles.
2. Przebudować loading/loaded states w `projects/[id]/index.tsx`, zachowując `useFocusEffect`, `api.getProject`, `api.getAudioTracks` i istniejące handlery.
3. Dodać AudioFlow top bar, hero-player dla projektów z audio oraz AudioFlow next-step panel dla projektów bez audio.
4. Przebudować siatkę narzędzi i footer menu na istniejące trasy.
5. Zaktualizować testy `project-detail.test.tsx` i uruchomić mobilny zakres testów.

Rollback jest prosty na poziomie aplikacji mobilnej: zmiana nie migruje danych ani kontraktów. W razie regresji można wycofać refaktor `index.tsx`; nowe prymitywy pozostaną nieużywane albo zostaną usunięte w tym samym revert.

## Open Questions

- Czy w późniejszym etapie chcemy przenieść pełne odtwarzanie inline do Project Details, czy utrzymać osobny pełny ekran `player.tsx` jako jedyne miejsce z `expo-av` i offline cache?
