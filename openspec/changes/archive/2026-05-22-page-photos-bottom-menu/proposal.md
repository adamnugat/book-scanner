# Propozycja: Ujednolicone dolne menu na ekranie zdjęć stron

## Problem

Ekran "Zdjęcia stron" (`apps/mobile/app/(app)/projects/[id]/images.tsx`) używa własnego, niespójnego dolnego paska akcji zbudowanego z `GhostButton` i `PearlButton` w `View`. Wygląda inaczej niż menu `AudioFlowFooterMenu` używane w kreatorze nowego audiobooka, co zaburza spójność design systemu AudioFlow.

## Oczekiwany efekt

Dolne menu na ekranie zdjęć stron wygląda i zachowuje się tak samo jak `AudioFlowFooterMenu` z kreatora, z trzema przyciskami:

- **Lewy** (ikona galerii): otwiera galerię zdjęć urządzenia
- **Środkowy** (ikona pearl, np. `check`): przycisk zapisu/potwierdzenia zmian — **nieaktywny** dopóki użytkownik nie wykona żadnej zmiany (dodanie zdjęcia, usunięcie zdjęcia, zmiana kolejności)
- **Prawy** (ikona aparatu): otwiera aparat fotograficzny

## Dlaczego teraz

Trwa aktywne ujednolicanie widoków pod design system AudioFlow (iteracje 11–12 w `progress.md`). Ekran zdjęć stron jest jednym z kluczowych ekranów użytkownika i niespójne menu jest widocznym regresem wizualnym.

## Zakres zmiany

- `apps/mobile/components/audioflow.tsx` — rozszerzenie `AudioFlowFooterMenu` o opcjonalne propsy dla lewej i prawej ikony/etykiety
- `apps/mobile/app/(app)/projects/[id]/images.tsx` — zastąpienie starego `bottomBar` przez `AudioFlowFooterMenu` z nową konfiguracją

## Poza zakresem

- Zmiany w backendzie, OCR/TTS, billing, auth, storage
- Ekran `new/images.tsx` — nie zmienia się
- Logika przesyłania zdjęć — nie zmienia się
