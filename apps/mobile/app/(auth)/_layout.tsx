import { Stack } from 'expo-router';

const SCREEN_BG = '#6b4c4c';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: SCREEN_BG },
        headerTintColor: '#F0EAD6',
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
