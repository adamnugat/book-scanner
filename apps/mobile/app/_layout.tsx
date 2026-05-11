import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth-context';
import { ToastProvider } from '../components/Toast';
import { AudioFlowScreen } from '../components/audioflow';

export default function RootLayout() {
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
