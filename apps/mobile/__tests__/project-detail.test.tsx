import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockGetProject = jest.fn();
const mockGetAudioTracks = jest.fn();
const mockDeleteProject = jest.fn();
const screenOptions: Array<{ headerTransparent?: boolean }> = [];

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), replace: jest.fn(), back: mockBack },
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

    expect(await screen.findByText('Odtwarzaj audiobooka')).toBeTruthy();
    expect(screen.queryByText('Następny krok: Text to Speech')).toBeNull();

    fireEvent.press(screen.getByText('Odtwarzaj audiobooka'));

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
