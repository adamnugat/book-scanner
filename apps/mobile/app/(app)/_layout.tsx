import { Stack } from 'expo-router';

const SCREEN_BG = '#131316';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'none',
        contentStyle: { flex: 1, backgroundColor: SCREEN_BG },
        freezeOnBlur: false,
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerBackVisible: false, title: '' }} />
      <Stack.Screen name="projects/new/index" options={{ title: 'Nowy audiobook' }} />
      <Stack.Screen name="projects/[id]/index" options={{ title: 'Audiobook' }} />
      <Stack.Screen name="projects/[id]/edit" options={{ title: 'Edycja audiobooka' }} />
      {/* Dynamic title set in screen: "Dodaj zdjęcia" / "Edytuj zdjęcia". OCR region selection
          and OCR correction are presented as modals on this screen, not separate routes. */}
      <Stack.Screen name="projects/[id]/images" options={{ title: 'Dodaj zdjęcia' }} />
      <Stack.Screen name="projects/[id]/scenes" options={{ title: 'Krok 2/2 · Sceny OCR' }} />
      <Stack.Screen name="projects/[id]/scenes/[sceneId]" options={{ title: 'Edycja sceny' }} />
<Stack.Screen name="projects/[id]/player" options={{ title: 'Odtwarzacz' }} />
      <Stack.Screen name="projects/[id]/sharing" options={{ title: 'Udostępnianie' }} />
      <Stack.Screen name="pricing/index" options={{ title: 'Cennik i plan' }} />
    </Stack>
  );
}
