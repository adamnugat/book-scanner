import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

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

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: (callback: () => void) => {
    const react = require('react');
    react.useEffect(() => { callback(); }, [callback]);
  },
  useLocalSearchParams: () => ({ id: 'proj-1' }),
}));

jest.mock('../lib/api', () => ({
  api: {
    getProjects: (...args: unknown[]) => mockGetProjects(...args),
    getProject: jest.fn(),
    deleteProject: jest.fn(),
  },
}));

jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

import ProjectsScreen from '../app/(app)/index';

describe('ProjectsScreen – with projects', () => {
  beforeEach(() => {
    mockGetProjects.mockImplementation(() => Promise.resolve(mockProjects));
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
});

describe('ProjectsScreen – empty state', () => {
  it('T-2.8: shows empty state with CTA when no projects', async () => {
    mockGetProjects.mockImplementation(() => Promise.resolve([]));
    render(<ProjectsScreen />);
    expect(
      await screen.findByText('Nie masz jeszcze żadnych projektów', {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.getByText('+ Nowy projekt')).toBeTruthy();
  });
});
