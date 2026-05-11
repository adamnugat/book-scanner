import { Stack } from 'expo-router';
import { AudioFlowStackHeader } from '../../components/audioflow-global-navigation';

const SCREEN_BG = '#131316';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { flex: 1, backgroundColor: SCREEN_BG },
        freezeOnBlur: false,
        header: (props) => <AudioFlowStackHeader {...props} />,
        headerShadowVisible: false,
        headerShown: true,
        headerStyle: { backgroundColor: SCREEN_BG },
        headerTintColor: '#F0EAD6',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ headerBackVisible: false, title: '' }} />
      <Stack.Screen name="projects/new/index" options={{ title: 'Nowy audiobook' }} />
      <Stack.Screen name="projects/new/images" options={{ title: 'Dodaj zdjęcia' }} />
      <Stack.Screen name="projects/new/review" options={{ title: 'Sprawdź tekst' }} />
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
