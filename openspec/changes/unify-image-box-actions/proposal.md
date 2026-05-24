## Why

W trybie zaawansowanym kreatora nowego audiobooka (Krok 2) karty zdjęć mają cztery małe przyciski akcji ułożone w jednym ciągu (`⊡`, `↑`, `↓`, `✕`) o niskiej dotykowej powierzchni i bez wizualnego pogrupowania funkcji. Trudno trafić w cel na małym ekranie, a kolejność „obszary–góra–dół–usuń” nie odzwierciedla intencji (wybór ≠ porządkowanie ≠ destrukcja). Dodatkowo karta zdjęcia w widoku „Zdjęcia stron” projektu (poza kreatorem) wygląda inaczej, ma tylko 3 przyciski (brak wyboru obszarów) i używa tekstowego „Usuń”. Niespójność dezorientuje użytkownika korzystającego z obu widoków.

## What Changes

- **Layout przycisków na karcie zdjęcia (tryb zaawansowany kreatora + widok „Zdjęcia stron”)**: trzy grupy w pasku akcji ułożone `space-between`:
  - **Lewa grupa**: pojedynczy przycisk wyboru obszarów OCR (z badge liczby zaznaczonych regionów, jeśli > 0).
  - **Środkowa grupa**: dwa sąsiadujące przyciski zmiany kolejności (`↑`, `↓`).
  - **Prawa grupa**: pojedynczy przycisk usuwania.
- **Większe pola dotykowe**: minimalna powierzchnia 44×44 pt (zgodnie z HIG/Material), padding zwiększony z aktualnego `12/5` na ok. `12/12` (kwadrat).
- **Ikony Feather**: zamiana tekstowych symboli (`⊡`/`↑`/`↓`/`✕`/„Usuń”) na ikony Feather z `@expo/vector-icons` (`crop`, `arrow-up`, `arrow-down`, `trash-2`).
- **Wspólny komponent karty**: ekstrakcja `PageImageCard` (lub analogicznej nazwy) do `apps/mobile/components/`, używany w `projects/new/images.tsx` (tryb zaawansowany) i `projects/[id]/images.tsx` (widok „Zdjęcia stron”), przyjmujący identyczne propsy akcji.
- **Widok „Zdjęcia stron” zyskuje wybór obszarów OCR**: ten sam przycisk lewej grupy otwiera istniejący widok wyboru obszarów dla danego zdjęcia.

## Capabilities

### New Capabilities

- `image-box-actions`: spójny pasek akcji karty zdjęcia (3 grupy: obszary / kolejność / usunięcie) z większymi przyciskami i wspólną implementacją między kreatorem zaawansowanym (Krok 2) a widokiem „Zdjęcia stron”.

### Modified Capabilities

- `audiobook-creation-wizard`: AC-2 (Krok 2 trybu zaawansowanego) — karta zdjęcia używa wspólnego `PageImageCard` z 3-grupowym layoutem zamiast inline pasków przycisków.

## Impact

- **apps/mobile**: nowy komponent `components/PageImageCard.tsx`; refaktor `app/(app)/projects/new/images.tsx` (`renderAdvancedItem`) i `app/(app)/projects/[id]/images.tsx` (`renderImage`) na użycie wspólnego komponentu; dodanie handlera otwierającego widok wyboru obszarów w `projects/[id]/images.tsx`.
- **apps/mobile**: aktualizacja istniejących testów Jest dla obu ekranów (zmiana akcessibilityLabel / struktury DOM); ew. nowy test `PageImageCard`.
- **packages/shared**: brak zmian.
- **apps/api**: brak zmian.
- **Weryfikacja**: `npm run test:mobile`, `npm run lint`, `npm run format:check`.

**Non-goals**: zmiany w dostawcach OCR/TTS, modelu subskrypcji, systemie udostępniania, przechowywaniu plików, mechanizmie autoryzacji, kontraktach API i Prisma. Brak zmian wizualnych poza paskiem akcji karty (sam podgląd zdjęcia, badge regionów, blur panel pozostają).
