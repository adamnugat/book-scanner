import { Stack } from 'expo-router';

const SCREEN_BG = '#1a1a2e';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: SCREEN_BG },
        headerTintColor: '#e0e0e0',
        contentStyle: { flex: 1, backgroundColor: SCREEN_BG },
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Logowanie', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Rejestracja' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset hasła' }} />
    </Stack>
  );
}
