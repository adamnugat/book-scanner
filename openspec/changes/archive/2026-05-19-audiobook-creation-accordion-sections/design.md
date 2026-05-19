## Context

Ekran `projects/new/index.tsx` wyświetla wybór języka jako pill buttons wewnątrz `GlassPanel`, a sekcje „Lektor" i „Wstawka muzyczna" jako statycznie rozwinięte listy `PickerCard`. Brak spójności — trzy logicznie równoważne sekcje konfiguracyjne mają różną strukturę wizualną. Zmiana dotyczy wyłącznie warstwy UI mobilnej (`apps/mobile`).

## Goals / Non-Goals

**Goals:**
- Trzy sekcje (Język, Lektor, Wstawka muzyczna) jako accordiony: zwinięte domyślnie, rozwijane przyciskiem ołówka.
- Domyślnie wybrana pierwsza opcja w każdej sekcji.
- „Wstawka głosowa" jako pierwsza pozycja w sekcji Wstawka muzyczna.
- Inline audio preview dla opcji jingle: odtwarzanie w tle, ikona play jako jedyny wskaźnik.

**Non-Goals:**
- Zmiany backendu, Prisma, `packages/shared`, OCR/TTS, autoryzacji, limitów planów.
- Animacje expand/collapse (brak wymogu).
- Wyciszanie audio przy wychodzeniu z ekranu (nice-to-have, nie wymagane).
- Zmiany kroku 2 i 3 kreatora.

## Decisions

### 1. Komponent `SectionAccordion` w `audioflow.tsx`

**Decyzja:** Nowy komponent `SectionAccordion` dodany do `components/audioflow.tsx`, eksportowany obok `SectionHeading` i `PickerCard`.

**Interfejs:**
```ts
interface SectionAccordionProps {
  title: string;
  description: string;
  selectedSummary: string;   // wyświetlane w zwiniętym stanie obok tytułu
  isExpanded: boolean;
  onEditPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
```

**Stan rozwinięcia zarządzany w `NewProjectScreen`** przez trzy niezależne flagi `expandedSection: 'language' | 'voice' | 'jingle' | null`. Kliknięcie ołówka w sekcji X: jeśli X jest aktualnie otwarta → zamknij; jeśli inna jest otwarta → zamknij ją, otwórz X (tylko jedna sekcja otwarta naraz).

**Alternatywa odrzucona:** `Animated.View` z płynnym expand — dodatkowa złożoność, animacja nie była wymagana.

### 2. Reorder `LOCAL_JINGLES`

**Decyzja:** Zmiana kolejności wpisów w `apps/mobile/lib/local-jingles.ts` — `page-turn-3` (Wstawka głosowa) jako index 0.

Konsekwencja: `selectedPresetName` inicjalizowany jako `LOCAL_JINGLES[0].name` automatycznie przyjmie `local:page-turn-3` bez dodatkowych zmian w `index.tsx`.

### 3. Inline audio preview dla jingle

**Decyzja:** Użycie `Audio.Sound.createAsync` z `expo-av` (ten sam wzorzec co `projects/[id]/index.tsx:248`).

Stan `playingJingleName: string | null` w `NewProjectScreen`. Logika:
- Kliknięcie na opcję jingle: zawsze ustawia `selectedPresetName` (wybór).
- Jeśli opcja ma `asset` (wszystkie `LOCAL_JINGLES` mają): dodatkowo odtwarza dźwięk.
- Jeśli `playingJingleName === jingle.name`: stop + clear (toggle off).
- Else: stop poprzednio grającego (jeśli jest), odtwórz nowy.
- Sound ref: `useRef<Audio.Sound | null>`.
- Po zakończeniu odtwarzania (`onPlaybackStatusUpdate`): wyczyść `playingJingleName`.

Ikona play: `trailing` prop `PickerCard` — wyświetlana gdy `playingJingleName === jingle.name`. Prosty `<Text>▶</Text>` lub ikona z istniejącego zestawu.

**Alternatywa odrzucona:** Osobny hook `useJinglePlayer` — premature abstraction dla jednego ekranu.

### 4. Accordion — stan collapsed

Collapsed state pokazuje: `[Tytuł sekcji] ··· [selectedSummary] [🖊]`

`selectedSummary` dla każdej sekcji:
- Język: `lang.label` (np. „Polski")
- Lektor: `voice.name` aktualnie wybranego głosu (lub „Ładowanie...")
- Wstawka: `jingle.label` aktualnie wybranej wstawki

## Risks / Trade-offs

- **Ładowanie głosów podczas zwiniętego accordionu:** Sekcja Lektor może być zwinięta gdy trwa fetch. `selectedSummary` pokaże „Ładowanie..." — akceptowalne, spinner nie jest potrzebny w collapsed view.
  
- **Audio leak:** Sound nie jest zatrzymywany przy unmount komponentu (np. cofnięcie do poprzedniego ekranu). Mitygacja: dodać cleanup w `useEffect` return — `soundRef.current?.unloadAsync()`.

- **Jeden accordion otwarty naraz vs. wiele:** Wybrano jeden naraz dla prostoty i mniejszego zajęcia ekranu. Trade-off: użytkownik musi zamknąć jedną sekcję, by zobaczyć drugą — akceptowalne przy 3 sekcjach.
