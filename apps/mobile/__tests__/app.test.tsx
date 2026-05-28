import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

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

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
    back: jest.fn(),
  },
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
    mockReplace.mockClear();
  });

  it('T-2.8: renders project list', async () => {
    render(<ProjectsScreen />);
    await screen.findByTestId('dashboard-last-played', {}, { timeout: 3000 });
    expect(screen.getAllByText('Pan Tadeusz').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Hamlet')).toBeTruthy();
  });

  it('does not show user email on the dashboard surface', async () => {
    render(<ProjectsScreen />);
    await screen.findByTestId('dashboard-last-played', {}, { timeout: 3000 });
    expect(screen.queryByText('test@example.com')).toBeNull();
  });

  it('shows status badges', async () => {
    render(<ProjectsScreen />);
    expect(await screen.findByText('Szkic', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getAllByText('Gotowe').length).toBeGreaterThanOrEqual(1);
  });

  it('renders welcome copy and footer create action', async () => {
    render(<ProjectsScreen />);

    expect(await screen.findByTestId('dashboard-last-played', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByText('Witaj ponownie')).toBeTruthy();
    expect(screen.queryByText('≋')).toBeNull();
    // dashboard uses create-only variant — Biblioteka and Odtwarzacz buttons are hidden
    expect(screen.queryByLabelText('Biblioteka')).toBeNull();
    expect(screen.queryByLabelText('Odtwarzacz')).toBeNull();
    expect(screen.getByLabelText('Nowy audiobook')).toBeTruthy();
    expect(screen.getAllByLabelText('Nowy audiobook')).toHaveLength(1);

    fireEvent.press(screen.getByLabelText('Nowy audiobook'));

    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/new');
  });

  it('shows last-played widget for the most recently updated project', async () => {
    render(<ProjectsScreen />);

    expect(await screen.findByTestId('dashboard-last-played', {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByText('Ostatnio odtwarzane')).toBeTruthy();
    expect(screen.getAllByText('Pan Tadeusz').length).toBeGreaterThanOrEqual(1);

    fireEvent.press(screen.getByLabelText('Odtwórz ostatni audiobook'));

    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/proj-1/player');
  });
});

describe('ProjectsScreen – last-played section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteProject.mockResolvedValue(undefined);
  });

  it('does not render last-played widget when projects list is empty', async () => {
    mockGetProjects.mockImplementation(() => Promise.resolve([]));
    render(<ProjectsScreen />);
    await screen.findByText('Nie masz jeszcze żadnych audiobooków', {}, { timeout: 3000 });
    expect(screen.queryByTestId('dashboard-last-played')).toBeNull();
  });

  it('hides last-played widget after all projects are deleted via Alert confirmation', async () => {
    mockGetProjects.mockImplementation(() => Promise.resolve([mockProjects[0]]));

    const { Alert } = require('react-native');
    let capturedButtons: Array<{ text: string; onPress?: () => void }> = [];
    jest.spyOn(Alert, 'alert').mockImplementation(
      (_title: string, _msg: string, buttons: typeof capturedButtons) => {
        capturedButtons = buttons ?? [];
      },
    );

    render(<ProjectsScreen />);
    await screen.findByTestId('dashboard-last-played', {}, { timeout: 3000 });

    // Trigger long-press via the project card's accessibility role
    const projectCards = screen.getAllByRole('button');
    // The first pressable button in the list is the project card
    const card = projectCards.find((el) => {
      const label = el.props.accessibilityLabel;
      return !label; // ProjectCard has no accessibilityLabel, just role="button"
    });
    if (card) fireEvent(card, 'longPress');

    // Confirm deletion via captured Alert button — wrap in act to flush async state update
    const deleteBtn = capturedButtons.find((b) => b.text === 'Usuń');
    if (deleteBtn?.onPress) {
      await act(async () => {
        await deleteBtn.onPress!();
      });
    }

    expect(mockDeleteProject).toHaveBeenCalledWith('proj-1');
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-last-played')).toBeNull();
    });
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
      await screen.findByText('Nie masz jeszcze żadnych audiobooków', {}, { timeout: 3000 }),
    ).toBeTruthy();
    expect(screen.getByText('Stwórz swój pierwszy audiobook!')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('dashboard-state-panel').props.style)).toEqual(
      expect.objectContaining({ marginBottom: expect.any(Number) }),
    );
    fireEvent.press(screen.getByLabelText('Nowy audiobook'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/new');
  });
});
