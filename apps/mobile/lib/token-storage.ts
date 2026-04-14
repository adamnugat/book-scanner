import { Platform } from 'react-native';

const ACCESS_KEY = 'book_scanner_access_token';
const REFRESH_KEY = 'book_scanner_refresh_token';

interface TokenStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

function createStore(): TokenStore {
  if (Platform.OS === 'web') {
    return {
      async getItem(key) {
        return localStorage.getItem(key);
      },
      async setItem(key, value) {
        localStorage.setItem(key, value);
      },
      async deleteItem(key) {
        localStorage.removeItem(key);
      },
    };
  }

  // Mobile — use expo-secure-store
  return {
    async getItem(key) {
      const SecureStore = await import('expo-secure-store');
      return SecureStore.getItemAsync(key);
    },
    async setItem(key, value) {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    },
    async deleteItem(key) {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    },
  };
}

const store = createStore();

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return store.getItem(ACCESS_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    return store.getItem(REFRESH_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await store.setItem(ACCESS_KEY, accessToken);
    await store.setItem(REFRESH_KEY, refreshToken);
  },
  async clear(): Promise<void> {
    await store.deleteItem(ACCESS_KEY);
    await store.deleteItem(REFRESH_KEY);
  },
};
