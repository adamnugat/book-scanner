import { Stack } from 'expo-router';
import { AudioFlowStackHeader } from '../../components/audioflow-global-navigation';

const SCREEN_BG = '#131316';

export default function AuthLayout() {
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
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false, title: 'Logowanie' }} />
      <Stack.Screen name="register" options={{ title: 'Rejestracja' }} />
      <Stack.Screen name="reset-password" options={{ title: 'Reset hasła' }} />
    </Stack>
  );
}
