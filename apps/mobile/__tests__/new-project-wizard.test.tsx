import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockCreateProject = jest.fn();
const mockGetVoices = jest.fn();
const mockGetInterstitialPresets = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
}));

jest.mock('../lib/api', () => ({
  api: {
    createProject: (...args: unknown[]) => mockCreateProject(...args),
    getVoices: (...args: unknown[]) => mockGetVoices(...args),
    getInterstitialPresets: (...args: unknown[]) => mockGetInterstitialPresets(...args),
  },
}));

import NewProjectScreen from '../app/(app)/projects/new';

describe('New audiobook wizard step 1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVoices.mockResolvedValue([
      {
        id: 'voice-1',
        elevenlabsVoiceId: 'marta-voice',
        name: 'Marta',
        language: 'pl',
        previewUrl: null,
      },
    ]);
    mockGetInterstitialPresets.mockResolvedValue([
      {
        id: 'page-turn',
        name: 'Page turn',
        audioUrl: 'presets/page-turn.mp3',
        durationMs: 1500,
      },
    ]);
    mockCreateProject.mockResolvedValue({
      id: 'proj-1',
      title: 'Pan Tadeusz',
      language: 'pl',
      coverUrl: null,
      voiceId: 'marta-voice',
      interstitialPreset: 'Page turn',
      status: 'draft',
      createdAt: '2026-05-11T00:00:00.000Z',
      updatedAt: '2026-05-11T00:00:00.000Z',
    });
  });

  it('loads voices and interstitial presets and creates a project before step 2', async () => {
    render(<NewProjectScreen />);

    expect(await screen.findByText('Krok 1 z 3')).toBeTruthy();
    expect(await screen.findByText('Marta')).toBeTruthy();
    expect(await screen.findByText('Page turn')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('np. Pan Tadeusz'), 'Pan Tadeusz');
    fireEvent.press(screen.getByText('Marta'));
    fireEvent.press(screen.getByText('Page turn'));
    fireEvent.press(screen.getByText('Dalej: dodaj zdjęcia'));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        title: 'Pan Tadeusz',
        language: 'pl',
        voiceId: 'marta-voice',
        interstitialPreset: 'Page turn',
      });
    });
    expect(mockGetVoices).toHaveBeenCalledWith('pl');
    expect(mockGetInterstitialPresets).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith('/(app)/projects/new/images?projectId=proj-1');
  });
});
