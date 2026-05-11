import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockGetProject = jest.fn();
const mockGetAudioTracks = jest.fn();
const mockDeleteProject = jest.fn();
const screenOptions: Array<{ headerTransparent?: boolean }> = [];

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
    back: mockBack,
  },
  useRouter: () => ({
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
    back: mockBack,
  }),
  Stack: {
    Screen: ({
      options,
    }: {
      options?: { headerRight?: () => React.ReactNode; headerTransparent?: boolean };
    }) => {
      screenOptions.push({ headerTransparent: options?.headerTransparent });
      return options?.headerRight?.() ?? null;
    },
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
    getProject: (...args: unknown[]) => mockGetProject(...args),
    getAudioTracks: (...args: unknown[]) => mockGetAudioTracks(...args),
    deleteProject: (...args: unknown[]) => mockDeleteProject(...args),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

import ProjectDetailScreen from '../app/(app)/projects/[id]/index';

const baseProject = {
  id: 'proj-1',
  title: 'Pan Tadeusz',
  coverUrl: null,
  language: 'pl',
  voiceId: null,
  interstitialPreset: null,
  status: 'ready_for_tts',
  createdAt: '2026-05-05T00:00:00.000Z',
  updatedAt: '2026-05-05T00:00:00.000Z',
};

describe('ProjectDetailScreen TTS next step', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    screenOptions.length = 0;
    mockGetProject.mockResolvedValue(baseProject);
    mockGetAudioTracks.mockResolvedValue([]);
  });

  it('shows a Text to Speech CTA when OCR is complete', async () => {
    render(<ProjectDetailScreen />);

    expect(await screen.findByText('Następny krok: Text to Speech')).toBeTruthy();
    fireEvent.press(screen.getByText('Wybierz głos i generuj audio'));

    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/proj-1/voice');
  });

  it('explains that text must be approved before TTS when the project is not ready', async () => {
    mockGetProject.mockResolvedValue({ ...baseProject, status: 'draft' });

    render(<ProjectDetailScreen />);

    expect(await screen.findByText('Najpierw zakończ OCR i zatwierdź tekst scen.')).toBeTruthy();
    expect(screen.queryByText('Wybierz głos i generuj audio')).toBeNull();
  });

  it('shows the listening cover state when generated audio exists', async () => {
    mockGetAudioTracks.mockResolvedValue([
      {
        id: 'track-1',
        sceneId: 'scene-1',
        storagePath: 'audio/1.mp3',
        audioUrl: 'https://example.com/audio/1.mp3',
        durationMs: 12000,
        fileSize: 1024,
        createdAt: '2026-05-05T00:00:00.000Z',
      },
    ]);

    render(<ProjectDetailScreen />);

    expect(await screen.findByTestId('audioflow-project-hero')).toBeTruthy();
    expect(screen.getByText('Pan Tadeusz')).toBeTruthy();
    expect(screen.getByLabelText('Postęp odtwarzania')).toBeTruthy();
    expect(screen.getByText('00:00')).toBeTruthy();
    expect(screen.getByText('00:12')).toBeTruthy();
    expect(screen.getByLabelText('Poprzedni rozdział')).toBeTruthy();
    expect(screen.getByLabelText('Odtwarzaj lub pauza')).toBeTruthy();
    expect(screen.getByLabelText('Następny rozdział')).toBeTruthy();
    expect(screen.queryByText('Następny krok: Text to Speech')).toBeNull();

    fireEvent.press(screen.getByLabelText('Odtwarzaj lub pauza'));

    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/proj-1/player');
  });

  it('renders accessible AudioFlow project tool tiles with existing routes', async () => {
    render(<ProjectDetailScreen />);

    expect(await screen.findByLabelText('Otwórz zdjęcia stron')).toBeTruthy();
    expect(screen.getByLabelText('Otwórz głos i audio')).toBeTruthy();
    expect(screen.getByLabelText('Otwórz udostępnianie')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Otwórz zdjęcia stron'));
    fireEvent.press(screen.getByLabelText('Otwórz głos i audio'));
    fireEvent.press(screen.getByLabelText('Otwórz udostępnianie'));

    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/proj-1/images');
    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/proj-1/voice');
    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/proj-1/sharing');
  });

  it('renders the AudioFlow footer menu with existing route actions', async () => {
    mockGetAudioTracks.mockResolvedValue([
      {
        id: 'track-1',
        sceneId: 'scene-1',
        storagePath: 'audio/1.mp3',
        audioUrl: 'https://example.com/audio/1.mp3',
        durationMs: 12000,
        fileSize: 1024,
        createdAt: '2026-05-05T00:00:00.000Z',
      },
    ]);

    render(<ProjectDetailScreen />);

    expect(await screen.findByLabelText('Biblioteka')).toBeTruthy();
    expect(screen.getByLabelText('Nowy audiobook')).toBeTruthy();
    expect(screen.getByLabelText('Odtwarzacz')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Biblioteka'));
    fireEvent.press(screen.getByLabelText('Nowy audiobook'));
    fireEvent.press(screen.getByLabelText('Odtwarzacz'));

    expect(mockReplace).toHaveBeenCalledWith('/(app)');
    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/new');
    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/proj-1/player');
  });

  it('moves edit and delete actions into the header options', async () => {
    render(<ProjectDetailScreen />);

    expect(await screen.findByLabelText('Opcje projektu')).toBeTruthy();
    expect(screen.queryByText('Edytuj projekt')).toBeNull();
    expect(screen.queryByText('Usuń projekt')).toBeNull();
  });

  it('keeps the transparent header before the audio cover loads', () => {
    mockGetProject.mockReturnValue(new Promise(() => undefined));
    mockGetAudioTracks.mockReturnValue(new Promise(() => undefined));

    render(<ProjectDetailScreen />);

    expect(screenOptions[0]).toMatchObject({ headerTransparent: true });
  });

  it('does not show a loader while project data is loading', () => {
    mockGetProject.mockReturnValue(new Promise(() => undefined));
    mockGetAudioTracks.mockReturnValue(new Promise(() => undefined));

    const { UNSAFE_queryByType } = render(<ProjectDetailScreen />);

    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });
});
