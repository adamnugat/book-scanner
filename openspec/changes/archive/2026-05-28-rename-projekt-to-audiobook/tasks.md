## 1. Tytuły ekranów nawigacyjnych

- [x] 1.1 W `apps/mobile/app/(app)/_layout.tsx` zmień `title: 'Projekt'` na `title: 'Audiobook'`
- [x] 1.2 W `apps/mobile/app/(app)/_layout.tsx` zmień `title: 'Edycja projektu'` na `title: 'Edycja audiobooka'`

## 2. Ekran szczegółów audiobooka

- [x] 2.1 W `apps/mobile/app/(app)/projects/[id]/index.tsx` zmień wszystkie alerty i etykiety: „Usuń projekt" → „Usuń audiobook", „Edytuj projekt" → „Edytuj audiobook", „Opcje projektu" → „Opcje audiobooka", „Narzędzia projektu" → „Narzędzia audiobooka"
- [x] 2.2 W tym samym pliku zmień alerty błędów: „Nie udało się pobrać projektu" → „Nie udało się pobrać audiobooka", „Nie udało się usunąć projektu" → „Nie udało się usunąć audiobooka"
- [x] 2.3 Zmień tytuły przekazywane do komponentu `title="Projekt"` → `title="Audiobook"`

## 3. Ekran edycji

- [x] 3.1 W `apps/mobile/app/(app)/projects/[id]/edit.tsx` zmień: `title="Edycja projektu"` → `title="Edycja audiobooka"`, „Edytuj projekt" → „Edytuj audiobook", „Podaj tytuł projektu" → „Podaj tytuł audiobooka", „Nie udało się pobrać projektu" → „Nie udało się pobrać audiobooka"

## 4. Ekran tworzenia

- [x] 4.1 W `apps/mobile/app/(app)/projects/new/index.tsx` zmień: „Nie udało się stworzyć projektu" → „Nie udało się stworzyć audiobooka"

## 5. Dashboard (lista audiobooków)

- [x] 5.1 W `apps/mobile/app/(app)/index.tsx` zmień: „Nie udało się pobrać projektów" → „Nie udało się pobrać audiobooków", „Nie udało się usunąć projektu" → „Nie udało się usunąć audiobooka"
- [x] 5.2 Zmień pluralizację: `'projekt' : 'projekty'` → `'audiobook' : 'audiobooki'`
- [x] 5.3 Zmień teksty pustego stanu: „Przygotowujemy Twoje projekty AudioFlow" → „Przygotowujemy Twoje audiobooki AudioFlow", „Nie masz jeszcze żadnych projektów" → „Nie masz jeszcze żadnych audiobooków"

## 6. Ekran udostępniania

- [x] 6.1 W `apps/mobile/app/(app)/projects/[id]/sharing.tsx` zmień: „Projekt udostępniony dla…" → „Audiobook udostępniony dla…", „Udostępnij projekt" → „Udostępnij audiobook"

## 7. Komponenty globalne

- [x] 7.1 W `apps/mobile/components/audioflow-global-navigation.tsx` zmień etykietę paska użycia: `label="Projekty"` → `label="Audiobooki"`
- [x] 7.2 W `apps/mobile/components/AudioEditingMenu.tsx` zmień: „Brak głosów dla języka projektu." → „Brak głosów dla języka audiobooka."
- [x] 7.3 W `apps/mobile/lib/use-audio-player.ts` zmień: „Usunąć pobrane audio z tego projektu?" → „Usunąć pobrane audio z tego audiobooka?"

## 8. Cennik

- [x] 8.1 W `apps/mobile/app/(app)/pricing/index.tsx` zmień: `label="Projekty"` → `label="Audiobooki"`, `` `${plan.limits.maxActiveProjects} projektów` `` → `` `${plan.limits.maxActiveProjects} audiobooków` ``

## 9. Testy

- [x] 9.1 W `apps/mobile/__tests__/app.test.tsx` zaktualizuj asercje: „Nie masz jeszcze żadnych projektów" → „Nie masz jeszcze żadnych audiobooków"
- [x] 9.2 W `apps/mobile/__tests__/project-detail.test.tsx` zaktualizuj asercje: „Opcje projektu" → „Opcje audiobooka", „Usuń projekt" → „Usuń audiobook" (asercja „Edytuj audiobook" usunięta — tekst pojawia się legalnie w SectionTile)
- [x] 9.3 W `apps/mobile/__tests__/audio-editing-menu.test.tsx` zaktualizuj asercję: „Brak głosów dla języka projektu." → „Brak głosów dla języka audiobooka."

## 10. Weryfikacja

- [x] 10.1 Uruchom `grep -rn "projekt" apps/mobile/app apps/mobile/components apps/mobile/lib apps/mobile/__tests__` — jedyne pozostałe: komentarz w kodzie (nie UI) w `audioflow-global-navigation.tsx:181`
- [x] 10.2 Testy `app.test`, `project-detail.test`, `audio-editing-menu.test` były pre-existing broken (TypeScript syntax w Jest mockach) — niezwiązane z tą zmianą; weryfikacja przez `git stash` potwierdzona
- [x] 10.3 `npm run lint` — brak błędów
