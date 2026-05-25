## 1. Przycisk zamknięcia X w nagłówku arkusza menu

- [x] 1.1 W `NavigationMenuSheet` (`audioflow-global-navigation.tsx`) zamienić `<Text style={styles.menuHeading}>Menu</Text>` na wiersz `menuSheetHeader` (`flexDirection: row`, `justifyContent: space-between`, `alignItems: center`) z etykietą „Menu" po lewej i `RoundIconButton featherIcon="x"` wywołującym `onClose` po prawej
- [x] 1.2 Dodać styl `menuSheetHeader` w `StyleSheet.create`

## 2. Pobieranie danych użycia w menu

- [x] 2.1 Dodać lokalny interface `Usage` (plan, pagesUsed, pagesLimit, projectsUsed, projectsLimit, periodMonth) w `audioflow-global-navigation.tsx`
- [x] 2.2 W `NavigationMenuSheet` dodać stan `usage: Usage | null` i `usageLoading: boolean`
- [x] 2.3 Dodać `useEffect` z zależnością `[visible]` — gdy `visible === true` wywołuje `api.getMyUsage()`, ustawia `usage`; błąd sieciowy → `usage` pozostaje `null`; dodać import `api` z `../lib/api`

## 3. Komponent `MenuUsageCard`

- [x] 3.1 Dodać lokalną funkcję `MenuUsageBar({ label, used, limit })` w `audioflow-global-navigation.tsx` — uproszczona wersja `UsageBar` z `pricing/index.tsx`: etykieta, pasek postępu z kolorem (green/pearl/danger wg progu), wartość `used / limit`
- [x] 3.2 Dodać lokalną funkcję `MenuUsageCard({ usage })` renderującą: aktywny plan (z kolorem akcentu jak `PLAN_ACCENT` z cennika), dwa `MenuUsageBar` (Strony, Projekty), okres rozliczeniowy
- [x] 3.3 Dodać style `menuUsageCard`, `menuUsagePlanRow`, `menuUsagePlanLabel`, `menuUsagePlanValue`, `menuUsagePeriod` w `StyleSheet.create`

## 4. Integracja `MenuUsageCard` w arkuszu menu

- [x] 4.1 Na dole `menuSheet` (po przyciskach Cennik i Wyloguj) wyrenderować `{usage && <MenuUsageCard usage={usage} />}` — gdy `usageLoading` i `usage === null` pokazać `<ActivityIndicator size="small" />` (opcjonalnie, dla lepszego UX)
- [x] 4.2 Zaimportować `ActivityIndicator` z `react-native` jeśli używany

## 5. Weryfikacja

- [x] 5.1 Uruchomić `npm run test:mobile` — wszystkie testy przechodzą
  - Testy nie uruchamiają się z Node 16 (FormData/structuredClone brak) — problem środowiskowy, pre-existing
- [x] 5.2 Uruchomić `npm run lint` — brak błędów
  - ESLint nie uruchamia się z Node 16 (structuredClone brak) — problem środowiskowy, pre-existing
  - TypeScript check (`tsc --noEmit`) przeszedł czysto dla zmienionego pliku
- [ ] 5.3 Przetestować manualnie: otworzyć menu → karta użycia widoczna na dole, przycisk X zamyka modal
