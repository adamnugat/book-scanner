import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const NetInfo = await import('@react-native-community/netinfo');
        unsubscribe = NetInfo.default.addEventListener((state) => {
          setIsOnline(state.isConnected ?? true);
        });
      } catch {
        setIsOnline(true);
      }
    })();

    return () => unsubscribe?.();
  }, []);

  return { isOnline };
}
