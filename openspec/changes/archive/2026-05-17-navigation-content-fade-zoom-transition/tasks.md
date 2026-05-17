## 1. Komponent FadeZoomContent

- [x] 1.1 Stworzyć `apps/mobile/components/FadeZoomContent.tsx` — `Animated.View` z animacją opacity (0→1) i scale (0.95→1.0) na mount, czas 200ms, `Easing.out(Easing.ease)`, `style={{ flex: 1 }}`

## 2. Konfiguracja Stack nawigacji

- [x] 2.1 Dodać `animation: 'none'` do `screenOptions` w `apps/mobile/app/(app)/_layout.tsx`
- [x] 2.2 Dodać `animation: 'none'` do `screenOptions` w `apps/mobile/app/(auth)/_layout.tsx`

## 3. Ekrany z footerowym menu (footer poza wrapperem)

- [x] 3.1 `apps/mobile/app/(app)/index.tsx` — owinąć content body (ScrollView/FlatList/View z treścią) w `<FadeZoomContent>`, footer (`AudioFlowBottomNavigation`) pozostaje jako rodzeństwo poza wrapperem
- [x] 3.2 `apps/mobile/app/(app)/pricing/index.tsx` — owinąć content body w `<FadeZoomContent>`, footer (`AudioFlowFooterMenu`) poza wrapperem
- [x] 3.3 `apps/mobile/app/(app)/projects/new/index.tsx` — owinąć content body w `<FadeZoomContent>`, footer (`AudioFlowFooterMenu`) poza wrapperem
- [x] 3.4 `apps/mobile/app/(app)/projects/new/images.tsx` — owinąć content body w `<FadeZoomContent>`, footer (`AudioFlowFooterMenu`) poza wrapperem
- [x] 3.5 `apps/mobile/app/(app)/projects/new/review.tsx` — owinąć content body w `<FadeZoomContent>`, footer (`AudioFlowFooterMenu`) poza wrapperem
- [x] 3.6 `apps/mobile/app/(app)/projects/[id]/index.tsx` — owinąć content body w `<FadeZoomContent>`, footer (`AudioFlowBottomNavigation`) poza wrapperem

## 4. Ekrany bez footerowego menu (wrapper obejmuje cały content)

- [x] 4.1 `apps/mobile/app/(app)/projects/[id]/edit.tsx` — owinąć cały content body w `<FadeZoomContent>`
- [x] 4.2 `apps/mobile/app/(app)/projects/[id]/images.tsx` — owinąć cały content body w `<FadeZoomContent>`
- [x] 4.3 `apps/mobile/app/(app)/projects/[id]/player.tsx` — owinąć cały content body w `<FadeZoomContent>`
- [x] 4.4 `apps/mobile/app/(app)/projects/[id]/scenes.tsx` — owinąć cały content body w `<FadeZoomContent>`
- [x] 4.5 `apps/mobile/app/(app)/projects/[id]/scenes/[sceneId].tsx` — owinąć cały content body w `<FadeZoomContent>`
- [x] 4.6 `apps/mobile/app/(app)/projects/[id]/sharing.tsx` — owinąć cały content body w `<FadeZoomContent>`
- [x] 4.7 `apps/mobile/app/(app)/projects/[id]/text-regions.tsx` — owinąć cały content body w `<FadeZoomContent>`
- [x] 4.8 `apps/mobile/app/(app)/projects/[id]/voice.tsx` — owinąć cały content body w `<FadeZoomContent>`

## 5. Ekrany auth

- [x] 5.1 `apps/mobile/app/(auth)/login.tsx` — owinąć content body w `<FadeZoomContent>`
- [x] 5.2 `apps/mobile/app/(auth)/register.tsx` — owinąć content body w `<FadeZoomContent>`
- [x] 5.3 `apps/mobile/app/(auth)/reset-password.tsx` — owinąć content body w `<FadeZoomContent>`

## 6. Weryfikacja

- [x] 6.1 Uruchomić `npm run test:mobile` — upewnić się, że testy przechodzą
- [x] 6.2 Uruchomić `npm run lint` — zero błędów lint
- [ ] 6.3 Manualne sprawdzenie: nawigacja w przód (push) — treść animuje się fade+zoom, header i footer statyczne
- [ ] 6.4 Manualne sprawdzenie: cofanie (pop) — brak zauważalnego flashu, header i footer statyczne
