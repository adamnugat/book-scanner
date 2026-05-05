import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockGetProject = jest.fn();
const mockDeleteProject = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), replace: jest.fn(), back: mockBack },
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
    mockGetProject.mockResolvedValue(baseProject);
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
});
