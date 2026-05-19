jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: jest.fn(() => [true, null]),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  const noopInsets = { top: 0, right: 0, bottom: 0, left: 0 };

  function SafeAreaProvider({ children }: { children?: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children ?? null);
  }

  return {
    SafeAreaProvider,
    useSafeAreaInsets: () => noopInsets,
  };
});
