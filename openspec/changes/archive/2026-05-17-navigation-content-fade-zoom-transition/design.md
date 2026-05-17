## Context

Aplikacja używa `Stack` z `expo-router` (NativeStack pod spodem). Domyślna animacja to `slide` — przesuwa cały ekran jako jedną całość, włącznie z headerem i stopką. Header jest renderowany przez `Stack` jako oddzielny element (via `header: (props) => <AudioFlowTopNavigation />`), ale w NativeStack jest przez OS animowany razem z kartą. Footer (`AudioFlowBottomNavigation` / `AudioFlowFooterMenu`) jest renderowany wewnątrz każdego ekranu, więc animuje się razem z kartą.

## Goals / Non-Goals

**Goals:**
- Animacja fade-in + lekki zoom-in przy wejściu na ekran, fade-out + lekki zoom-out przy wyjściu
- Animacja dotyczy wyłącznie obszaru treści (content body) — nie header, nie footer
- Header i footer zmieniają się bez skalowania (ewentualnie mogą płynnie przenikać jeśli ich treść się zmienia)

**Non-Goals:**
- Zmiany w backendzie, API, schemacie Prisma, auth, storage, billing, sharing
- Animacje wewnątrz ekranów (listy, dialogi, toast)
- Wsparcie dla web-specific CSS transitions

## Decisions

### Decyzja 1: wyłączyć animację Stack, animację treści obsłużyć komponentem wrapper

**Wybór:** `animation: 'none'` w `screenOptions` + dedykowany komponent `FadeZoomContent` wrapping obszar treści ekranu.

**Dlaczego:** NativeStack animuje cały ekran razem z headerem na poziomie OS. Nie ma API do selektywnego wyłączenia animacji headera przy zachowaniu animacji karty. Jedyną alternatywą z selektywną animacją jest JS Stack (`@react-navigation/stack` z `headerMode: 'float'`), ale to wymaga zmiany biblioteki nawigacji i wiąże się z ryzykiem regresji.

Wyłączając animację Stack i delegując ją do komponentu JS (`Animated.View` lub `react-native-reanimated`), uzyskujemy pełną kontrolę: footer renderowany poza wrapperem nie animuje się, header Stack nie animuje się.

**Alternatywy rozważone:**
- `@react-navigation/stack` + `headerMode: 'float'` + custom `cardStyleInterpolator`: lepsza izolacja headera, ale footer nadal w karcie (animuje się razem z treścią) + zmiana biblioteki = ryzyko regresji dla całej nawigacji
- `animation: 'fade'` w NativeStack: cały ekran (header + treść + footer) zanika jednocześnie — nie spełnia wymagania selektywności i brak efektu zoom

### Decyzja 2: użyć react-native-reanimated zamiast Animated API

**Wybór:** `Animated` z core React Native (bez dodatkowej biblioteki).

**Dlaczego:** Expo SDK 54 ma już `react-native-reanimated` w zależnościach, ale aby uniknąć nowych zależności i uprościć scope, używamy `Animated` z core RN. Animacja fade+zoom jest prosta (opacity + scale), nie wymaga gesture handling ani shared values. Jeśli w przyszłości będzie potrzeba bardziej złożonych animacji — migracja do reanimated jest prosta.

### Decyzja 3: struktura komponentu FadeZoomContent

`FadeZoomContent` to `Animated.View` z `style={{ flex: 1 }}`, który na mount uruchamia równoległą animację opacity (0→1) i scale (0.95→1.0). Czas trwania: ~200ms. Easing: `Easing.out(Easing.ease)`.

Każdy ekran wraps swój "content body" w `<FadeZoomContent>`, natomiast footer pozostaje poza wrapperem jako rodzeństwo w tym samym widoku rodzica.

```
<View style={{ flex: 1 }}>
  <FadeZoomContent>
    {/* ScrollView / FlatList / treść */}
  </FadeZoomContent>
  <AudioFlowBottomNavigation ... />   ← poza wrapperem, nie animuje się
</View>
```

## Risks / Trade-offs

| Ryzyko | Mitigacja |
|--------|-----------|
| Ekrany bez footera (np. player, pricing) — animacja obejmuje cały ekran | Akceptowalne — footer nie jest wszędzie, dla takich ekranów `FadeZoomContent` wraps cały content i jest to poprawne zachowanie |
| Animacja nie działa przy popie (cofaniu) — `FadeZoomContent` animuje tylko mount | Na pop content nowego ekranu (poprzedniego) mountuje się i animuje fade-in+zoom-in normalnie; stack `animation: 'none'` nie dodaje nic swojego — efekt może być mniej wyraźny przy cofaniu niż przy przejściu w przód. Akceptowalne jako MVP. |
| Regresja: stabilność nawigacji — zmiana `animation: 'none'` wpływa na wszystkie przejścia | Weryfikacja przez istniejący test suite (`npm run test:mobile`) + manualne przejście po głównych ścieżkach |
| Zbyt agresywny zoom może powodować layout shift | Wartości scale (0.95→1.0) i czas (200ms) dobrane konserwatywnie; można łatwo dostroić |

## Migration Plan

1. Dodać `animation: 'none'` do `screenOptions` w `apps/mobile/app/(app)/_layout.tsx`
2. Stworzyć `apps/mobile/components/FadeZoomContent.tsx`
3. Zaktualizować każdy ekran z footer: wraps content body w `<FadeZoomContent>`, footer poza wrapperem
4. Zaktualizować ekrany bez footer: wraps cały content body w `<FadeZoomContent>`
5. Uruchomić `npm run test:mobile` + `npm run lint`

Rollback: usunąć `FadeZoomContent`, przywrócić poprzedni `animation` (brak explicit = default slide).

## Open Questions

- Czy animacja przy cofaniu (pop) powinna być inna niż przy wejściu (push)? Jeśli tak — potrzebny parametr `type: 'enter' | 'exit'` w `FadeZoomContent`, wyzwalany przez `useNavigationState`.
