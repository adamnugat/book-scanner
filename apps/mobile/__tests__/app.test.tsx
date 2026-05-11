import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockProjects = [
  {
    id: 'proj-1',
    title: 'Pan Tadeusz',
    coverUrl: null,
    language: 'pl',
    voiceId: null,
    interstitialPreset: null,
    status: 'draft',
    createdAt: '2026-04-13T10:00:00.000Z',
    updatedAt: '2026-04-13T10:00:00.000Z',
  },
  {
    id: 'proj-2',
    title: 'Hamlet',
    coverUrl: null,
    language: 'en',
    voiceId: null,
    interstitialPreset: null,
    status: 'completed',
    createdAt: '2026-04-12T10:00:00.000Z',
    updatedAt: '2026-04-12T10:00:00.000Z',
  },
];

const mockGetProjects = jest.fn(() => Promise.resolve(mockProjects));
const mockDeleteProject = jest.fn();
const mockPush = jest.fn();
const mockLogout = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: (callback: () => void) => {
    const react = require('react');
    react.useEffect(() => {
      callback();
    }, [callback]);
  },
  useLocalSearchParams: () => ({ id: 'proj-1' }),
}));

jest.mock('../lib/api', () => ({
  api: {
    getProjects: (...args: unknown[]) => mockGetProjects(...args),
    getProject: jest.fn(),
    deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
  },
}));

jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: (...args: unknown[]) => mockLogout(...args),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import ProjectsScreen from '../app/(app)/index';

describe('ProjectsScreen – with projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProjects.mockImplementation(() => Promise.resolve(mockProjects));
    mockDeleteProject.mockResolvedValue(undefined);
  });

  it('T-2.8: renders project list', async () => {
    render(<ProjectsScreen />);
    expect(await screen.findByText('Pan Tadeusz', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByText('Hamlet')).toBeTruthy();
  });

  it('shows user email in header', async () => {
    render(<ProjectsScreen />);
    expect(await screen.findByText('test@example.com', {}, { timeout: 3000 })).toBeTruthy();
  });

  it('shows status badges', async () => {
    render(<ProjectsScreen />);
    expect(await screen.findByText('Szkic', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getAllByText('Gotowe').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the AudioFlow dashboard shell and footer create action', async () => {
    render(<ProjectsScreen />);

    expect(await screen.findByText('Witaj ponownie')).toBeTruthy();
    expect(screen.getByText('AudioFlow')).toBeTruthy();
    expect(screen.getByLabelText('Logo AudioFlow equalizer')).toBeTruthy();
    expect(screen.queryByText('≋')).toBeNull();
    expect(screen.getByLabelText('Biblioteka')).toBeTruthy();
    expect(screen.getByLabelText('Nowy audiobook')).toBeTruthy();
    expect(screen.getAllByLabelText('Nowy audiobook')).toHaveLength(1);

    fireEvent.press(screen.getByLabelText('Nowy audiobook'));

    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/new');
  });

  it('keeps filtering and sorting controls after the AudioFlow redesign', async () => {
    render(<ProjectsScreen />);

    expect(await screen.findByText('Pan Tadeusz', {}, { timeout: 3000 })).toBeTruthy();
    fireEvent.press(screen.getAllByText('Gotowe')[0]);

    expect(screen.queryByText('Pan Tadeusz')).toBeNull();
    expect(screen.getByText('Hamlet')).toBeTruthy();

    fireEvent.press(screen.getByText('Tytuł'));

    expect(screen.getByText('Hamlet')).toBeTruthy();
  });
});

describe('ProjectsScreen – empty state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('T-2.8: shows empty state with CTA when no projects', async () => {
    mockGetProjects.mockImplementation(() => Promise.resolve([]));
    render(<ProjectsScreen />);
    expect(
      await screen.findByText('Nie masz jeszcze żadnych projektów', {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.getByText('Stwórz swój pierwszy audiobook!')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('dashboard-state-panel').props.style)).toEqual(
      expect.objectContaining({ marginBottom: expect.any(Number) }),
    );
    fireEvent.press(screen.getByLabelText('Nowy audiobook'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/new');
  });
});
