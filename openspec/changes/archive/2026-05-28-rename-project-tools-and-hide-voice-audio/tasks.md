## 1. Zmiany w ekranie szczegółów projektu

- [x] 1.1 W `apps/mobile/app/(app)/projects/[id]/index.tsx` zmień stałą `PROJECT_TOOL_COUNT` z `3` na `2`
- [x] 1.2 Zmień `title="Zdjęcia stron"` na `title="Edytuj audiobook"` w pierwszym `SectionTile`
- [x] 1.3 Usuń prop `summary={statusLabel}` z kafelka "Edytuj audiobook"
- [x] 1.4 Zmień `accessibilityLabel="Otwórz zdjęcia stron"` na `"Otwórz edycję audiobooka"`
- [x] 1.5 Usuń blok JSX `<SectionTile ... title="Głos i audio" .../>` z sekcji narzędzi

## 2. Aktualizacja testów

- [x] 2.1 W `apps/mobile/__tests__/project-detail.test.tsx` zaktualizuj asercje: "Zdjęcia stron" → "Edytuj audiobook", brak summary statusu, brak "Głos i audio", licznik "2 dostępne"

## 3. Weryfikacja

- [x] 3.1 Uruchom `npm run test:mobile` — wszystkie testy przechodzą
- [x] 3.2 Uruchom `npm run lint` — brak błędów
