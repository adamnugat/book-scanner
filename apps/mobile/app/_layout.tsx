import { Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { VarelaRound_400Regular } from '@expo-google-fonts/varela-round';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { AuthProvider } from '../lib/auth-context';
import { ToastProvider } from '../components/Toast';

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
          <View style={{ flex: 1, backgroundColor: '#131316' }}>
            <Slot />
          </View>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
