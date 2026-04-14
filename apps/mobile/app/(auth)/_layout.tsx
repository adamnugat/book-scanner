import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#e0e0e0',
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Logowanie', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Rejestracja' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset hasła' }} />
    </Stack>
  );
}
