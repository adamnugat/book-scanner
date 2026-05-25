## Context

`NavigationMenuSheet` w `apps/mobile/components/audioflow-global-navigation.tsx` renderuje modal z arkuszem menu wycentrowanym na ekranie. Arkusz zawiera nagłówek „Menu", przyciski „Cennik" i „Wyloguj". Tło kliknięcia zamyka modal — brak dedykowanego przycisku X.

Ekran Cennik (`apps/mobile/app/(app)/pricing/index.tsx`) zawiera kartę „Twoje wykorzystanie" z: aktywnym planem, dwoma paskami postępu (`UsageBar`) dla stron i projektów, oraz informacją o okresie rozliczeniowym. Dane pobierane przez `api.getMyUsage()` — endpoint już istnieje.

Biblioteka ikon: `@expo/vector-icons` — wyłącznie `Feather` (zgodnie z preferencjami projektu).

## Goals / Non-Goals

**Goals:**
- Przycisk X (`Feather` `x`) w prawym górnym rogu arkusza menu — zamyka modal.
- Sekcja użycia pakietu na dole arkusza — pobierana asynchronicznie przy otwarciu menu, wyświetla: plan, paski stron/projektów, okres.
- Obsługa stanu ładowania (spinner) i błędu (cicha — brak sekcji gdy fetch się nie powiedzie).

**Non-Goals:**
- Współdzielony komponent `UsageCard` w osobnym pliku — duplikacja lokalna jest akceptowalna.
- Animacje, redesign arkusza, zmiany na ekranie Cennik.

## Decisions

### 1. Przycisk zamknięcia X — `RoundIconButton` w nagłówku arkusza

**Problem:** Arkusz nie ma jawnego przycisku zamknięcia.

**Decyzja:** Dodać wiersz nagłówka arkusza z tekstem „Menu" po lewej i `RoundIconButton featherIcon="x"` po prawej. Zamiast centralnego `<Text>Menu</Text>` — `flexDirection: 'row'` z `justifyContent: 'space-between'`.

**Alternatywa odrzucona:** Floating button poza arkuszem — trudniejsze pozycjonowanie w layoucie absolutnym modala.

### 2. Dane użycia — `useEffect` w `NavigationMenuSheet`

**Problem:** Dane trzeba pobrać przy otwarciu menu, nie przy renderowaniu całej aplikacji.

**Decyzja:** `NavigationMenuSheet` otrzymuje `visible` prop — `useEffect([visible])` odpala `api.getMyUsage()` gdy `visible === true`. Stan lokalny: `usage: Usage | null`, `usageLoading: boolean`. Błąd sieci → `usage` pozostaje `null` → sekcja nie renderuje się (brak alert/toast).

**Alternatywa odrzucona:** Pobranie danych w `AudioFlowGlobalMenuButton` i przekazanie przez props — niepotrzebne prop drilling, dane potrzebne tylko gdy menu otwarte.

### 3. Komponent `MenuUsageCard` — lokalny w pliku nawigacji

**Problem:** `UsageBar` i logika renderowania istnieją w `pricing/index.tsx` — czy wyciągać do shared?

**Decyzja:** Zduplikować `UsageBar` i `MenuUsageCard` lokalnie w `audioflow-global-navigation.tsx`. Komponent jest prosty (< 30 linii), reużycie na razie tylko w 2 miejscach — nie uzasadnia ekstrakcji.

**Alternatywa odrzucona:** Import z `pricing/index.tsx` — screen-level komponent nie powinien być importowany przez layout komponent.

### 4. Layout arkusza — nagłówek + content + footer usage

Strukturę arkusza zmienić z flat listy na:
```
menuSheet
  ├── menuSheetHeader (row: "Menu" label + X button)
  ├── menuButton (Cennik)
  ├── menuButton (Wyloguj)
  └── menuUsageCard (if usage != null)
```

`menuSheet` dostaje `gap: t.spacing.stackMd` — już istnieje, bez zmian.

## Risks / Trade-offs

- **Fetch przy każdym otwarciu menu** → minimalne — `getMyUsage()` to lekki endpoint. Akceptowalne bez cache.
- **Layout arkusza na małych ekranach** → karta użycia może nie zmieścić się gdy arkusz ma `paddingTop: 120` od góry. Mitigation: `ScrollView` wewnątrz arkusza lub zmniejszenie `paddingTop` gdy `usage != null`. Prefer: sprawdzić na iPhone SE (375pt height).
