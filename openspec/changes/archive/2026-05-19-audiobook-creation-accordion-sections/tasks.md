## 1. Reorder LOCAL_JINGLES

- [x] 1.1 W `apps/mobile/lib/local-jingles.ts` przenieś wpis `local:page-turn-3` (Wstawka głosowa, 🎙️) na pozycję index 0 w tablicy `LOCAL_JINGLES`
- [x] 1.2 Zweryfikuj, że `selectedPresetName` inicjalizowany jako `LOCAL_JINGLES[0].name` w `projects/new/index.tsx` automatycznie przyjmuje `'local:page-turn-3'`

## 2. SectionAccordion component

- [x] 2.1 Dodaj interfejs `SectionAccordionProps` do `apps/mobile/components/audioflow.tsx` z propsami: `title`, `description`, `selectedSummary`, `isExpanded`, `onEditPress`, `children`, `style?`
- [x] 2.2 Zaimplementuj komponent `SectionAccordion` w `audioflow.tsx`: collapsed state (nagłówek + selectedSummary + przycisk ołówka), expanded state (opis + children)
- [x] 2.3 Dodaj style dla `SectionAccordion` w `StyleSheet.create` w `audioflow.tsx` (zgodne z tokenami AudioFlow)
- [x] 2.4 Wyeksportuj `SectionAccordion` z `audioflow.tsx`

## 3. Accordion state in NewProjectScreen

- [x] 3.1 Dodaj stan `expandedSection: 'language' | 'voice' | 'jingle' | null` (domyślnie `null`) w `NewProjectScreen`
- [x] 3.2 Zaimplementuj handler `handleEditPress(section)` — toggle tej samej sekcji lub zamknij poprzednią i otwórz nową

## 4. Refactor sekcji Język

- [x] 4.1 Wydziel sekcję „Język" z `GlassPanel` (usun pill buttons i label „Język" z karty tytułu/tytułu)
- [x] 4.2 Zastąp pill buttons listą `PickerCard` (jeden card per język) wewnątrz `SectionAccordion`
- [x] 4.3 Ustaw `selectedSummary` dla Języka jako `label` aktualnie wybranego języka (np. „Polski")

## 5. Refactor sekcji Lektor

- [x] 5.1 Opakuj istniejącą sekcję „Lektor" (lista `PickerCard` z głosami) w komponent `SectionAccordion`
- [x] 5.2 Ustaw `selectedSummary` dla Lektora jako `name` aktualnie wybranego głosu (lub „Ładowanie..." podczas `loadingOptions`)
- [x] 5.3 Upewnij się, że accordion Lektora jest domyślnie zwinięty, a pierwszy głos z API jest wybrany domyślnie

## 6. Refactor sekcji Wstawka muzyczna

- [x] 6.1 Opakuj istniejącą sekcję „Wstawka muzyczna" (lista `PickerCard` z jingleami) w komponent `SectionAccordion`
- [x] 6.2 Ustaw `selectedSummary` dla Wstawki jako `label` aktualnie wybranego jingle
- [x] 6.3 Upewnij się, że accordion Wstawki jest domyślnie zwinięty, a „Wstawka głosowa" jest wybraną domyślnie opcją

## 7. Inline audio preview dla jingle

- [x] 7.1 Dodaj stan `playingJingleName: string | null` i `soundRef = useRef<Audio.Sound | null>(null)` w `NewProjectScreen`
- [x] 7.2 Zaimplementuj handler `handleJinglePress(jingle: LocalJingle)`: ustaw `selectedPresetName`, zatrzymaj poprzedni sound jeśli istnieje, odtwórz `jingle.asset` przez `Audio.Sound.createAsync`, zaktualizuj `playingJingleName`
- [x] 7.3 Dodaj `onPlaybackStatusUpdate` callback — gdy `didJustFinish === true`, wyczyść `playingJingleName` i zwolnij sound
- [x] 7.4 Dodaj `useEffect` cleanup — przy unmount wywołaj `soundRef.current?.unloadAsync()`
- [x] 7.5 Przekaż `trailing={<Text>▶</Text>}` do `PickerCard` jingle gdy `playingJingleName === jingle.name`

## 8. Weryfikacja

- [x] 8.1 Uruchom `npm run lint` i napraw ewentualne błędy TypeScript/ESLint
- [x] 8.2 Uruchom `npm run test:mobile` i napraw ewentualne testy regresji w `__tests__/` dotyczące ekranu `projects/new`
- [x] 8.3 Przetestuj ręcznie ekran `projects/new/index` na symulatorze: sprawdź accordion toggle, domyślne selekcje, odtwarzanie jingle i ikonę play
