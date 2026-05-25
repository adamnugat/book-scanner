## Context

Aktualnie istnieją dwie odrębne implementacje edytora regionów OCR w `apps/mobile`:

- **Kreator nowych audiobooków** — `apps/mobile/app/(app)/projects/new/images.tsx:704` — modal renderowany inline. Obsługuje jednocześnie zdjęcia już uploadowane (`PageImageResponse`) i lokalne pending assets (`pendingUri`). Używa częściowo design systemu (`AudioFlowScreen`, `AudioFlowFooterMenu`, `GlassPanel`, `PageImageCard`), ale styl edytora to lokalne `StyleSheet` z surowymi kolorami (`#101320`, `#0f3460`, `#06d6a0`, `#e94560`).
- **Ekran „Zdjęcia stron" istniejącego projektu** — `apps/mobile/app/(app)/projects/[id]/images.tsx:206` używa `router.push` do `/(app)/projects/${id}/text-regions?pageImageId=${imageId}`, który renderuje `TextRegionsScreen` (`apps/mobile/app/(app)/projects/[id]/text-regions.tsx:54`). Ten ekran zbiorczy ma własną listę wszystkich zdjęć, własny modal edytora i tytuł „Zaznacz regiony tekstu". Reguły stylu są jeszcze inne (typografia, paddingi, dolny pasek z przyciskiem „Pomiń"). Po anulowaniu modala użytkownik zostaje na tym ekranie zbiorczym zamiast wrócić do „Zdjęć stron".

Trasa `projects/[id]/text-regions` jest zarejestrowana w `apps/mobile/app/(app)/_layout.tsx:28` z tytułem `Regiony tekstu`.

Stałe behawiory geometrii i kontrakty backend nie zmieniają się:
- `apps/mobile/lib/text-region-geometry.ts` (`createNormalizedRegion`, `denormalizeRegion`).
- `apps/mobile/lib/api.ts` — `getTextRegions`, `saveTextRegions`.
- `packages/shared` — `TextRegionInput`, `TextRegionResponse`, `PageImageResponse`.

Design system AudioFlow: `apps/mobile/components/audioflow-tokens.ts` (`audioFlowTokens`, `audioFlowStyles`), `apps/mobile/components/audioflow.tsx` (`AudioFlowScreen`, `AudioFlowFooterMenu`, `GlassPanel`), `apps/mobile/components/PageImageCard.tsx`, `apps/mobile/components/PageImagePreview.tsx`, `apps/mobile/components/FadeZoomContent.tsx`.

## Goals / Non-Goals

**Goals:**
- Jeden komponent `OcrRegionEditor` jako jedyne źródło prawdy dla UI edytora regionów (gesty, overlay, lista regionów, akcje).
- Edytor zgodny z `audioFlowTokens` (kolory, typografia, surface, borderRadius), używa `GlassPanel`/`AudioFlowScreen`/`AudioFlowFooterMenu` zamiast surowych styli.
- Identyczne zachowanie w obu przepływach: rysowanie regionu, lista regionów, usuwanie, zapis, anulowanie, brak regionów = OCR całej strony.
- Anulowanie zawsze wraca do ekranu wywołującego (kreator → kreator, zdjęcia stron → zdjęcia stron). Brak landing na nieistniejącym już ekranie zbiorczym.
- Usunięcie starego ekranu zbiorczego `text-regions.tsx` oraz jego wpisu w `_layout.tsx` bez utraty funkcji (lista regionów per zdjęcie nadal dostępna w widoku „Zdjęcia stron" przez `regionCount` na `PageImageCard`).
- Brak zmian w kontraktach API i w geometrii.

**Non-Goals:**
- Brak zmian w `apps/api`, `packages/shared`, Prisma, OCR providerach, storage, auth, billing.
- Brak zmian w trybie automatycznym kreatora (`mode === 'auto'`).
- Brak refaktoru `PageImageCard`, `AudioFlowFooterMenu` ani innych komponentów design systemu poza tym, co konieczne do osadzenia edytora.
- Brak nowych zależności npm.
- Brak głębokich linków do edytora (deep linking) ani trwałości stanu draftu w storage.

## Decisions

### 1. Wspólny komponent: `OcrRegionEditor`
- Lokalizacja: `apps/mobile/components/audioflow/OcrRegionEditor.tsx` (folder `audioflow/` powstanie obok `audioflow-tokens.ts` — pasuje do istniejącej grupy importów `from '../../../../components/audioflow'`).
- API komponentu (stateless wrt routing, kontroler trzymający dane):
  ```ts
  type OcrEditorTarget =
    | { kind: 'uploaded'; image: PageImageResponse }
    | { kind: 'pending'; uri: string; displayName?: string };

  interface OcrRegionEditorProps {
    target: OcrEditorTarget;
    initialRegions: RegionDraft[];
    onCancel: () => void;
    onSave: (regions: RegionDraft[]) => void;
    pageLabel?: string; // np. "Strona 3"
  }
  ```
- Komponent renderuje pełny ekran (nie modal!) wewnątrz `AudioFlowScreen` z `FadeZoomContent`. Zawiera: nagłówek (eyebrow + headlineLg z `audioFlowStyles`), `GlassPanel` z podglądem zdjęcia i overlayami regionów, listę regionów z akcją „Usuń" (Feather icon `trash-2`), oraz `AudioFlowFooterMenu` z akcjami „Anuluj" i „Zapisz".
- Stylowanie wyłącznie przez `audioFlowTokens` / `audioFlowStyles` (kolory, radius, typografia). Brak surowych hex codes w komponencie.
- Geometria niezmieniona — komponent woła `createNormalizedRegion` / `denormalizeRegion` z `apps/mobile/lib/text-region-geometry.ts`.

**Alternatywa**: kontynuacja jako modal w obu ekranach. Odrzucone — modal w expo-router łamie standardową nawigację (back nie wraca do wywołującego ekranu w sposób przewidywalny na Androidzie/web; ponadto duplikuje logikę przejść). Pełny ekran daje natywne back/swipe.

### 2. Routing i prezentacja
- Z kreatora (`/projects/new/images.tsx`):
  - Zachować lokalny state listy regionów. Otwieranie edytora **bez** zmiany trasy — komponent `OcrRegionEditor` renderowany warunkowo jako pełnoekranowy overlay (zamiast modala) sterowany przez `editingItem`. Wymaga jedynie zamiany `<Modal>` na `<View style={StyleSheet.absoluteFill}>` z `AudioFlowScreen` w środku.
  - Powód: kreator trzyma duży lokalny state (`pendingAssets`, `regions`, `mode`), którego nie chcemy przerzucać przez router params/global state.
- Ze „Zdjęć stron" (`/projects/[id]/images.tsx`):
  - Nowa trasa: `apps/mobile/app/(app)/projects/[id]/text-regions/[pageImageId].tsx` (folder `text-regions/` z plikiem dynamicznym). Trasa otrzymuje `id` i `pageImageId` z params, pobiera istniejące regiony przez `api.getTextRegions(id)` + filtr, renderuje `OcrRegionEditor`, na zapis zapisuje przez `api.saveTextRegions(id, ...)`, na anuluj wywołuje `router.back()`.
  - Wpis trasy w `_layout.tsx`: `<Stack.Screen name="projects/[id]/text-regions/[pageImageId]" options={{ headerShown: false, title: 'Regiony tekstu' }} />`. Header ukryty, bo `AudioFlowScreen` ma własny.
  - `openRegionEditor` w `[id]/images.tsx:205-207` zmienia push z `?pageImageId=` (query) na segment trasy: `/(app)/projects/${id}/text-regions/${imageId}`.

**Alternatywa A**: w pełni dzielona trasa używana też przez kreator. Odrzucone — kreator ma niezapisane uploady (pending assets), które jeszcze nie istnieją po stronie API jako `PageImage`, więc shared route musiałaby przyjmować dane przez globalny store. Wzrost złożoności bez zysku.

**Alternatywa B**: zachować obecne `?pageImageId=` jako query na `[id]/text-regions.tsx` po refaktorze tego pliku. Odrzucone — punktem zmiany jest też usunięcie ekranu zbiorczego „Regiony tekstu". Zachowanie pliku jako wrapper-routera tylko gmatwa intencję.

### 3. Usunięcie starego ekranu i listy zbiorczej
- Skasować: `apps/mobile/app/(app)/projects/[id]/text-regions.tsx`.
- Usunąć wpis w `apps/mobile/app/(app)/_layout.tsx:28`.
- Sprawdzić, czy żaden inny kod nie linkuje do `/projects/[id]/text-regions` bez segmentu `pageImageId`. Jeśli tak — przekierować do `/projects/[id]/images`.
- Funkcjonalność „Zapisz wszystkie regiony i przejdź dalej" (przycisk „Dalej →" w starym ekranie zbiorczym) NIE wraca w nowym przepływie dla istniejącego projektu — w widoku „Zdjęcia stron" zapis regionów następuje per zdjęcie, a nawigacja „dalej" jest sterowana globalnym CTA tego ekranu (jeśli istnieje) lub po stronie projektu. Ten przepływ był używany tylko w starym kreatorze, którego już nie ma. Należy zweryfikować podczas implementacji.

### 4. Stylowanie i ikony
- Wszystkie ikony — Feather z `@expo/vector-icons` (`trash-2`, `x`, `check`), zgodnie z preferencją w pamięci.
- Kolory regionów: zachować zielony „solidny" i czerwony „drag" — przemapować na `audioFlowTokens.color.accent.*` (`success`/`pearl`) zamiast `#06d6a0`/`#e94560`. Jeśli takie tokeny nie istnieją, dodać semantic mapping do `audioflow-tokens.ts` (`accent.success`, `accent.warn`). Zmiana lokalna w pliku tokens — bez API.
- Tytuły: PL strings („Zaznacz regiony OCR", „Strona N", „Brak regionów — OCR odczyta całą stronę.", „Anuluj", „Zapisz").

### 5. Stan i synchronizacja
- W kreatorze stan trzymany lokalnie w `images.tsx` — bez zmiany.
- W trasie `[id]/text-regions/[pageImageId].tsx`: stan ładowany on-mount (`api.getTextRegions(id)` filtrowany po `pageImageId`), zapis ostateczny przez `api.saveTextRegions(id, merged)` (merge: pozostałe strony z `getTextRegions` + nowo zapisane regiony tej strony, posortowane `orderIndex`). Po zapisie `router.back()` do `[id]/images.tsx`. `[id]/images.tsx` MUSI re-fetch `regionCounts` przez istniejący `useFocusEffect` (jeśli go nie ma, dodać re-fetch w focus listener).

## Risks / Trade-offs

- **[Ryzyko] Duplikacja `RegionDraft` między kreatorem a nowym komponentem** → Mitigation: wyciągnąć typ do `apps/mobile/lib/text-region-geometry.ts` lub do pliku z komponentem; importować w obu miejscach.
- **[Ryzyko] `router.back()` na web (history API) zachowuje się inaczej niż na natywnym** → Mitigation: jeśli brak history (deep link bezpośrednio do `[pageImageId]`), użyć `router.replace(`/(app)/projects/${id}/images`)` jako fallback (`canGoBack()` check).
- **[Ryzyko] Re-fetch `regionCounts` po powrocie zwiększa liczbę zapytań** → Mitigation: można też przekazać licznik przez `router.setParams` lub po prostu re-fetch w `useFocusEffect`. Wybór: focus re-fetch (prostsze, zgodne z istniejącym wzorcem w `text-regions.tsx`).
- **[Ryzyko] Usunięcie `text-regions.tsx` zerwie deep linki, jeśli ktoś je zapisał** → Mitigation: brak publicznego deep linka do tego ekranu (sprawdzono w `_layout.tsx` — brak konfiguracji deep link scheme dla tej trasy). Ryzyko niskie. Można zostawić plik jako redirect na `[id]/images` przez 1 release i potem usunąć — opcjonalne, raczej overkill dla wewnętrznego flow.
- **[Trade-off] Pełny ekran zamiast modala**: tracimy „slide-up" animację bottom-sheet, zyskujemy native back i prostszą nawigację. Decyzja: full screen wewnątrz `AudioFlowScreen` z `FadeZoomContent` (animacja zachowana).
- **[Ryzyko] Komponent przyjmuje pending assets bez `pageImageId`** → Mitigation: typ `OcrEditorTarget` union pokrywa oba przypadki; logika merge w callerze (`onSave`) — komponent zwraca regiony bez troski o klucz, caller dopisuje `pageImageId`/`pendingUri`.

## Migration Plan

1. Dodać `OcrRegionEditor` jako nowy komponent (kompletny, używany w obu miejscach).
2. Podpiąć w kreatorze — zastąpić `<Modal>` overlayem z nowym komponentem. Sprawdzić, że wszystkie ścieżki uploaded/pending nadal działają.
3. Dodać nową trasę `[id]/text-regions/[pageImageId].tsx`. Zarejestrować w `_layout.tsx`.
4. Zmienić `openRegionEditor` w `[id]/images.tsx` na push do nowej trasy.
5. Dodać re-fetch `regionCounts` w `useFocusEffect` w `[id]/images.tsx` (jeśli brak).
6. Usunąć stary plik `text-regions.tsx` i jego wpis w `_layout.tsx`.
7. Uruchomić `npm run test:mobile`, `npm run lint`, `npm run format:check`. Manualnie zweryfikować oba przepływy.

Rollback: zmiana czysto frontendowa w jednym workspace — `git revert` PR-a.

## Open Questions

- Czy w trasie `[id]/text-regions/[pageImageId]` po zapisie pokazujemy toast („Zapisano regiony")? Sugestia: tak, użyć istniejącego `Toast` z `apps/mobile/components/Toast.tsx`. Do potwierdzenia z autorem.
- Czy tokens design systemu mają już `accent.success` / `accent.warn` (zielony/czerwony) — jeśli nie, dodać czy użyć istniejących? Do potwierdzenia podczas implementacji (sprawdzić `audioflow-tokens.ts`).
