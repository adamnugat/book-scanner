import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth-context';
import { ToastProvider } from '../components/Toast';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Slot />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
