import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockCreateProject = jest.fn();
const mockGetVoices = jest.fn();
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
  },
}));

jest.mock('../assets/audio/page-turn-1.mp3', () => 1, { virtual: true });
jest.mock('../assets/audio/page-turn-2.wav', () => 2, { virtual: true });
jest.mock('../assets/audio/page-turn-3.mp3', () => 3, { virtual: true });

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: { unloadAsync: jest.fn() } }),
    },
    setAudioModeAsync: jest.fn(),
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
    mockCreateProject.mockResolvedValue({
      id: 'proj-1',
      title: 'Pan Tadeusz',
      language: 'pl',
      coverUrl: null,
      voiceId: 'marta-voice',
      interstitialPreset: 'local:page-turn-1',
      status: 'draft',
      createdAt: '2026-05-11T00:00:00.000Z',
      updatedAt: '2026-05-11T00:00:00.000Z',
    });
  });

  it('loads voices, shows local jingle options, creates project before step 2', async () => {
    render(<NewProjectScreen />);

    expect(await screen.findByText('Krok 1 z 3')).toBeTruthy();
    expect(screen.getByText('Zacznijmy od podstaw')).toBeTruthy();
    expect(screen.getByText('Lektor')).toBeTruthy();
    expect(screen.getByText('Wstawka muzyczna')).toBeTruthy();

    // Open voice accordion and select voice
    await waitFor(() => expect(screen.getByLabelText('Edytuj Lektor')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Edytuj Lektor'));
    expect(await screen.findByText('Marta')).toBeTruthy();
    fireEvent.press(screen.getByText('Marta'));

    // Open jingle accordion and verify all options are present
    fireEvent.press(screen.getByLabelText('Edytuj Wstawka muzyczna'));
    expect(screen.getByText('🎙️  Wstawka głosowa')).toBeTruthy();
    expect(screen.getByText('🔔  Przewracanie strony 1')).toBeTruthy();
    expect(screen.getByText('🔔  Przewracanie strony 2')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('np. Pan Tadeusz'), 'Pan Tadeusz');
    fireEvent.press(screen.getByLabelText('Dalej'));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith({
        title: 'Pan Tadeusz',
        language: 'pl',
        voiceId: 'marta-voice',
        interstitialPreset: 'local:page-turn-3',
      });
    });
    expect(mockGetVoices).toHaveBeenCalledWith('pl');
    expect(mockRouterReplace).toHaveBeenCalledWith('/(app)/projects/new/images?projectId=proj-1');
  });

  it('does not fetch interstitial presets from backend', async () => {
    const mockGetInterstitialPresets = jest.fn();
    render(<NewProjectScreen />);
    await screen.findByText('Marta');
    expect(mockGetInterstitialPresets).not.toHaveBeenCalled();
  });
});
