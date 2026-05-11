import { Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { VarelaRound_400Regular } from '@expo-google-fonts/varela-round';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth-context';
import { ToastProvider } from '../components/Toast';
import { AudioFlowScreen } from '../components/audioflow';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    VarelaRound_400Regular,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <AudioFlowScreen>
            <Slot />
          </AudioFlowScreen>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
