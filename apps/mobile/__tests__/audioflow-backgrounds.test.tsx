import React from 'react';
import { render, screen } from '@testing-library/react-native';

const mockRegister = jest.fn();
const mockResetPassword = jest.fn();
const mockGetPricing = jest.fn();
const mockGetMyUsage = jest.fn();

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    register: (...args: unknown[]) => mockRegister(...args),
  }),
}));

jest.mock('../lib/api', () => ({
  api: {
    resetPassword: (...args: unknown[]) => mockResetPassword(...args),
    getPricing: (...args: unknown[]) => mockGetPricing(...args),
    getMyUsage: (...args: unknown[]) => mockGetMyUsage(...args),
  },
}));

import PricingScreen from '../app/(app)/pricing';
import RegisterScreen from '../app/(auth)/register';
import ResetPasswordScreen from '../app/(auth)/reset-password';

describe('AudioFlow shared backgrounds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPricing.mockImplementation(() => new Promise(() => undefined));
    mockGetMyUsage.mockImplementation(() => new Promise(() => undefined));
  });

  it('renders auth utility screens on the AudioFlow background', () => {
    const registerRender = render(<RegisterScreen />);
    expect(screen.getByTestId('audioflow-screen')).toBeTruthy();
    registerRender.unmount();

    render(<ResetPasswordScreen />);
    expect(screen.getByTestId('audioflow-screen')).toBeTruthy();
  });

  it('renders app utility screens on the AudioFlow background while loading', () => {
    render(<PricingScreen />);

    expect(screen.getByTestId('audioflow-screen')).toBeTruthy();
  });
});
