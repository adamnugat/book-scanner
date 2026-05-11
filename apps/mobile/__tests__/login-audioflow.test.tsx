import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockLogin = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  Link: ({
    children,
    href,
    style,
  }: {
    children: React.ReactNode;
    href: string;
    style?: unknown;
  }) => {
    const { Text } = require('react-native');
    return (
      <Text accessibilityRole="link" accessibilityLabel={`Link ${href}`} style={style}>
        {children}
      </Text>
    );
  },
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    login: (...args: unknown[]) => mockLogin(...args),
  }),
}));

import LoginScreen from '../app/(auth)/login';

describe('AudioFlow login screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders AudioFlow brand, glass login form, auth links, and no social login affordances', () => {
    render(<LoginScreen />);

    expect(screen.getByText('AudioFlow')).toBeTruthy();
    expect(screen.getByLabelText('Logo AudioFlow equalizer')).toBeTruthy();
    expect(screen.queryByText('≋')).toBeNull();
    expect(screen.getByText('Wejdź do swojego studia audiobooków')).toBeTruthy();
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    expect(screen.getAllByText('Hasło')).toHaveLength(1);
    expect(screen.getByText('Zaloguj')).toBeTruthy();
    expect(screen.getByText('Nie masz konta? Zarejestruj się')).toBeTruthy();
    expect(screen.getByText('Zapomniałeś hasła?')).toBeTruthy();
    expect(screen.queryByText(/Google/i)).toBeNull();
    expect(screen.queryByText(/Apple/i)).toBeNull();
  });

  it('validates empty credentials without calling login', () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByText('Zaloguj'));

    expect(mockLogin).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Podaj email i hasło');
  });

  it('logs in and navigates to the app', async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'ala@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
    fireEvent.press(screen.getByText('Zaloguj'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('ala@example.com', 'secret123');
    });
    expect(mockReplace).toHaveBeenCalledWith('/(app)');
  });
});
