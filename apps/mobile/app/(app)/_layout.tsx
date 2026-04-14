import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#e0e0e0',
        headerTitleStyle: { fontWeight: 'bold' },
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
