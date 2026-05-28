## Context

Ekran szczegółów projektu (`apps/mobile/app/(app)/projects/[id]/index.tsx`) renderuje sekcję "Narzędzia projektu" z trzema `SectionTile`: "Zdjęcia stron", "Głos i audio", "Udostępnij". Zmiana dotyczy wyłącznie tego pliku — brak wpływu na backend, Prisma, shared package ani inne ekrany.

Stałe `PROJECT_TOOL_COUNT = 3` i props `summary={statusLabel}` na pierwszym kafelku są jedynymi miejscami wymagającymi korekty poza samymi etykietami.

## Goals / Non-Goals

**Goals:**
- Przemianować kafelek "Zdjęcia stron" → "Edytuj audiobook" (etykieta + accessibilityLabel).
- Usunąć `summary` (status projektu) z kafelka edycji audiobooka.
- Ukryć kafelek "Głos i audio" przez warunkowe renderowanie `{false && <SectionTile ... />}` lub przez jego usunięcie z JSX.
- Zmniejszyć `PROJECT_TOOL_COUNT` z `3` do `2`.

**Non-Goals:**
- Żadnych zmian w `voice.tsx`, trasie `projects/[id]/voice`, backendzie.
- Nie przenosimy funkcji audio/głosu do widoku edycji (osobna iteracja).
- Brak zmian w testach jednostkowych `voice-audio.test.tsx`.

## Decisions

**Ukrycie przycisku "Głos i audio": usunięcie z JSX vs. warunkowe `{false &&}`**

Decyzja: całkowite usunięcie `SectionTile` "Głos i audio" z JSX. Trasa i plik `voice.tsx` pozostają, więc nic nie jest nieodwracalne. Warunkowe `{false && ...}` zostawia martwy kod — prostsze jest zwykłe usunięcie bloku JSX.

**`PROJECT_TOOL_COUNT` → wartość stała vs. dynamiczne liczenie**

Decyzja: zaktualizować stałą do `2`. Liczenie widocznych kafelków dynamicznie byłoby over-engineeringiem przy małej liczbie narzędzi.

## Risks / Trade-offs

- [Testy] `apps/mobile/__tests__/project-detail.test.tsx` może sprawdzać tekst "Zdjęcia stron" lub liczbę kafelków → należy zaktualizować asercje. Weryfikacja: `npm run test:mobile`.
- [Deep links] Żaden deep link nie kieruje na kafelek głosu, tylko na trasę `/voice` — brak ryzyka.
