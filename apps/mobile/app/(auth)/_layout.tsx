import { Stack } from 'expo-router';

const SCREEN_BG = '#131316';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'none',
        contentStyle: { flex: 1, backgroundColor: SCREEN_BG },
        freezeOnBlur: false,
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false, title: 'Logowanie' }} />
      <Stack.Screen name="register" options={{ title: 'Rejestracja' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset hasła' }} />
    </Stack>
  );
}
