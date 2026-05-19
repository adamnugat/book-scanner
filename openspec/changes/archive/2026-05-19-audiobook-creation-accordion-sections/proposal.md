## Why

Formularz tworzenia nowego audiobooka (`projects/new/index.tsx`) wyświetla wybór języka jako niezależne przyciski pill-style, różniące się wizualnie od sekcji „Lektor" i „Wstawka muzyczna". Brakuje spójności UX – każda z tych trzech sekcji powinna wyglądać i działać tak samo: jako accordion z domyślnie wybraną pierwszą opcją, rozwijany przez przycisk edycji z ikoną ołówka.

## What Changes

- Sekcja „Język" zostaje wydzielona jako pełnoprawna sekcja-accordion (zamiast pill buttons), z pierwszą opcją (pl) wybraną domyślnie.
- Sekcje „Lektor" i „Wstawka muzyczna" zyskują ten sam wzorzec accordionu.
- Każdy accordion: w stanie zwiniętym pokazuje tylko nagłówek + wybraną wartość + przycisk ołówka; po kliknięciu ołówka rozwija się i pokazuje opis sekcji oraz listę opcji do wyboru.
- W sekcji „Wstawka muzyczna" kolejność `LOCAL_JINGLES` zostaje zmieniona tak, aby „Wstawka głosowa" (mic icon, `local:page-turn-3`) była pierwszą pozycją i domyślnym wyborem.
- Kliknięcie na opcję „Wstawka głosowa" odtwarza jej dźwięk w tle (bez przejścia do odtwarzacza). Aktywne odtwarzanie jest sygnalizowane wyłącznie ikoną play po prawej stronie danej opcji.

## Capabilities

### New Capabilities

- `audiobook-creation-accordion-sections`: Wzorzec accordion dla sekcji Język / Lektor / Wstawka muzyczna w kreatorze nowego audiobooka, z inline audio preview dla wstawek głosowych.

### Modified Capabilities

- `audiobook-creation-wizard`: Zmiana układu sekcji wyboru na ekranie `projects/new/index.tsx` (sposób wyświetlania opcji Język, Lektor, Wstawka muzyczna).

## Impact

- `apps/mobile/app/(app)/projects/new/index.tsx` – refaktor sekcji język/lektor/wstawka na komponent accordion.
- `apps/mobile/lib/local-jingles.ts` – zmiana kolejności wpisów: `page-turn-3` (Wstawka głosowa) jako pierwszy.
- `apps/mobile/components/audioflow.tsx` – nowy komponent `SectionAccordion` (lub rozszerzenie istniejących).
- Bez zmian: backend, baza danych, typy w `packages/shared`, logika OCR/TTS, autoryzacja, limity planów.
