import { Stack } from 'expo-router';

const SCREEN_BG = '#1a1a2e';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: SCREEN_BG },
        headerTintColor: '#e0e0e0',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { flex: 1, backgroundColor: SCREEN_BG },
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Moje projekty', headerShown: false }} />
      <Stack.Screen name="projects/new" options={{ title: 'Nowy projekt' }} />
      <Stack.Screen name="projects/[id]/index" options={{ title: 'Projekt' }} />
      <Stack.Screen name="projects/[id]/edit" options={{ title: 'Edycja projektu' }} />
      <Stack.Screen name="projects/[id]/images" options={{ title: 'Zdjęcia stron' }} />
      <Stack.Screen name="projects/[id]/text-regions" options={{ title: 'Regiony tekstu' }} />
      <Stack.Screen name="projects/[id]/scenes" options={{ title: 'Sceny – OCR' }} />
      <Stack.Screen name="projects/[id]/scenes/[sceneId]" options={{ title: 'Edycja sceny' }} />
      <Stack.Screen name="projects/[id]/voice" options={{ title: 'Głos lektora' }} />
      <Stack.Screen name="projects/[id]/player" options={{ title: 'Odtwarzacz' }} />
      <Stack.Screen name="projects/[id]/sharing" options={{ title: 'Udostępnianie' }} />
      <Stack.Screen name="pricing/index" options={{ title: 'Cennik i plan' }} />
    </Stack>
  );
}
