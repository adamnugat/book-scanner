## Why

Przy **wyłącznie wstecznej** nawigacji w aplikacji mobilnej (expo-router / stack) widać krótkie, uciążliwe miganie obejmujące **cały obszar ekranu od góry do dołu** — nie jest to problem ograniczony do paska statusu ani navbara. Objaw występuje **w całej aplikacji**, co pasuje do hipotezy **konfliktu lub nietypowej kompozycji sąsiednich widoków** w natywnym stosie (`react-native-screens`): podczas animacji `goBack` przez krótki czas widoczne są dwie warstwy ekranu i różnice tła / treści dają efekt „flashu” na całej powierzchni. Naprawa ma ustabilizować renderowanie **tylko** przy cofaniu, we wszystkich grupach tras.

## What Changes

- Identyfikacja źródła migania (m.in. kompozycja dwóch ekranów w stacku, `StatusBar`, `SafeAreaView`, opcje animacji, `headerShown`, `detachInactiveScreens` / zachowanie natywnych screenów) i poprawka w konfiguracji nawigacji lub layoutu w `apps/mobile`.
- Spójne traktowanie **wszystkich** głównych `Stack`ów (np. `(app)/_layout.tsx`, `(auth)/_layout.tsx`) oraz ewentualnie korzenia, aby nie było jednorazowej poprawki tylko w jednym segmencie aplikacji.
- Ujednolicenie tła i kompozycji sceny podczas animacji **cofnięcia**, tak aby sąsiednie widoki nie „przebijały” kontrastującą klatką na **całym ekranie** przy `goBack` (nawigacja w przód pozostaje poza zakresem objawu).
- Regresja: cofanie w auth, w liście projektów i w podstronach projektu — brak migania.

## Capabilities

### New Capabilities

- `mobile-app-navigation`: wymagania dotyczące stabilnego, pełnoekranowego wyglądu przy **wyłącznie wstecznej** nawigacji w **całej** aplikacji Expo; brak widocznego „flashu” na całej powierzchni ekranu przy standardowym cofaniu ze stosu, także gdy przyczyna leży w kompozycji sąsiednich widoków w natywnym stacku.

### Modified Capabilities

- (brak)

## Impact

- Głównie workspace `apps/mobile`: layouty ze `Stack` (`app/_layout.tsx`, `app/(app)/_layout.tsx`, `app/(auth)/_layout.tsx`), ewentualnie **root kontenery poszczególnych ekranów** (pełne tło pod `ScrollView`/listą), opcje `Stack.Screen` lub komponenty współdzielone nagłówka. Możliwa zależność od `expo-status-bar`, `react-native-safe-area-context`, `react-native-screens` — bez zmian wersji, o ile nie okaże się konieczna.
- Brak zmian w `apps/api`, `packages/shared`, providerach OCR/TTS, storage i auth.
- Weryfikacja: ręczne testy na iOS (i ewentualnie Android/web), `npm run test:mobile` oraz `npm run lint` po zmianach.
- Non-goals: brak zmian w rozliczeniach i planach subskrypcji, w udostępnianiu projektów, w integracji OCR/TTS, w zapisie plików na S3 oraz w modelu uwierzytelniania — wyłącznie UX nawigacji i powiązany layout.
