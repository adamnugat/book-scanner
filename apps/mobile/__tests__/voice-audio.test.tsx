import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockGetProject = jest.fn();
const mockGetVoices = jest.fn();
const mockGetScenes = jest.fn();
const mockGetAudioTracks = jest.fn();
const mockUpdateProject = jest.fn();
const mockGenerateAudio = jest.fn();
const mockPush = jest.fn();
const mockGetCachedAudioForTrack = jest.fn();
const mockSoundCreate = jest.fn();
const mockSoundPause = jest.fn();
const mockSoundUnload = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() },
  useFocusEffect: (callback: () => void | (() => void)) => {
    const react = require('react');
    react.useEffect(() => {
      const cleanup = callback();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, [callback]);
  },
  useLocalSearchParams: () => ({ id: 'proj-1' }),
}));

jest.mock('../lib/api', () => ({
  api: {
    getProject: (...args: unknown[]) => mockGetProject(...args),
    getVoices: (...args: unknown[]) => mockGetVoices(...args),
    getScenes: (...args: unknown[]) => mockGetScenes(...args),
    getAudioTracks: (...args: unknown[]) => mockGetAudioTracks(...args),
    updateProject: (...args: unknown[]) => mockUpdateProject(...args),
    generateAudio: (...args: unknown[]) => mockGenerateAudio(...args),
  },
}));

jest.mock('../lib/offline-cache', () => ({
  offlineCache: {
    getCachedAudioForTrack: (...args: unknown[]) => mockGetCachedAudioForTrack(...args),
  },
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: (...args: unknown[]) => mockSoundCreate(...args),
    },
    setAudioModeAsync: jest.fn(),
  },
}));

import VoiceSelectScreen from '../app/(app)/projects/[id]/voice';

const project = {
  id: 'proj-1',
  title: 'Pan Tadeusz',
  coverUrl: null,
  language: 'pl',
  voiceId: 'el-voice-1',
  interstitialPreset: null,
  status: 'ready_for_tts',
  createdAt: '2026-05-05T00:00:00.000Z',
  updatedAt: '2026-05-05T00:00:00.000Z',
};

const voices = [
  {
    id: 'voice-row-1',
    elevenlabsVoiceId: 'el-voice-1',
    name: 'Antoni',
    language: 'pl',
    previewUrl: null,
  },
];

const scenes = [
  {
    id: 'scene-1',
    projectId: 'proj-1',
    pageImageId: 'img-1',
    ocrText: 'Tekst',
    editedText: 'Tekst',
    status: 'ready_for_audio',
    orderIndex: 0,
    createdAt: '2026-05-05T00:00:00.000Z',
    updatedAt: '2026-05-05T00:00:00.000Z',
  },
  {
    id: 'scene-2',
    projectId: 'proj-1',
    pageImageId: 'img-2',
    ocrText: 'Audio',
    editedText: 'Audio',
    status: 'audio_done',
    orderIndex: 1,
    createdAt: '2026-05-05T00:00:00.000Z',
    updatedAt: '2026-05-05T00:00:00.000Z',
  },
];

const tracks = [
  {
    id: 'track-1',
    sceneId: 'scene-2',
    storagePath: 'projects/proj-1/audio/track-1.mp3',
    audioUrl: 'http://api.test/projects/proj-1/audio-tracks/track-1/file?token=t',
    durationMs: 5000,
    fileSize: 2048,
    createdAt: '2026-05-05T00:00:00.000Z',
  },
];

const tracksMulti = [
  {
    id: 'track-1',
    sceneId: 'scene-1',
    storagePath: 'projects/proj-1/audio/track-1.mp3',
    audioUrl: 'http://api.test/projects/proj-1/audio-tracks/track-1/file?token=t1',
    durationMs: 5000,
    fileSize: 2048,
    createdAt: '2026-05-05T00:00:00.000Z',
  },
  {
    id: 'track-2',
    sceneId: 'scene-2',
    storagePath: 'projects/proj-1/audio/track-2.mp3',
    audioUrl: 'http://api.test/projects/proj-1/audio-tracks/track-2/file?token=t2',
    durationMs: 6000,
    fileSize: 3072,
    createdAt: '2026-05-05T00:00:00.000Z',
  },
];

describe('VoiceSelectScreen voice and audio flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProject.mockResolvedValue(project);
    mockGetVoices.mockResolvedValue(voices);
    mockGetScenes.mockResolvedValue(scenes);
    mockGetAudioTracks.mockResolvedValue(tracks);
    mockUpdateProject.mockResolvedValue(project);
    mockGenerateAudio.mockResolvedValue([{ ...scenes[0], status: 'audio_generating' }]);
    mockGetCachedAudioForTrack.mockResolvedValue(null);
    mockSoundCreate.mockResolvedValue({
      sound: { pauseAsync: mockSoundPause, unloadAsync: mockSoundUnload },
    });
    mockSoundPause.mockResolvedValue(undefined);
    mockSoundUnload.mockResolvedValue(undefined);
  });

  it('loads voices, scene readiness, and generated audio tracks', async () => {
    render(<VoiceSelectScreen />);

    expect(await screen.findByText('Antoni')).toBeTruthy();
    expect(screen.getByText('Gotowe sceny do audio: 1')).toBeTruthy();
    expect(screen.getByText('Wygenerowane audio')).toBeTruthy();
    expect(screen.getByText('Scena 2')).toBeTruthy();
    expect(screen.getByText('5 s · 2 KB')).toBeTruthy();
    expect(mockGetVoices).toHaveBeenCalledWith('pl');
  });

  it('starts audio generation and refreshes state after a 202 response', async () => {
    render(<VoiceSelectScreen />);

    fireEvent.press(await screen.findByText('Generuj audio'));

    await waitFor(() => {
      expect(mockGenerateAudio).toHaveBeenCalledWith('proj-1');
      expect(mockGetScenes).toHaveBeenCalledTimes(2);
      expect(mockGetAudioTracks).toHaveBeenCalledTimes(2);
    });
  });

  it('disables generation when no scene is ready for audio', async () => {
    mockGetScenes.mockResolvedValue([{ ...scenes[0], status: 'ocr_done' }]);

    render(<VoiceSelectScreen />);

    expect(await screen.findByText('Zatwierdź tekst scen przed TTS')).toBeTruthy();
    fireEvent.press(screen.getByText('Zatwierdź tekst scen przed TTS'));

    expect(mockGenerateAudio).not.toHaveBeenCalled();
  });

  it('shows a useful configuration error when voices cannot be loaded', async () => {
    mockGetVoices.mockRejectedValue(new Error('Unable to load TTS voices'));

    render(<VoiceSelectScreen />);

    expect(
      await screen.findByText('Nie udało się pobrać głosów. Sprawdź konfigurację ElevenLabs.'),
    ).toBeTruthy();
  });
});

describe('VoiceSelectScreen audio generation polling', () => {
  const generatingScenes = [
    { ...scenes[0], status: 'audio_generating' },
    { ...scenes[1], status: 'audio_generating' },
  ];
  const finishedScenes = [
    { ...scenes[0], status: 'audio_done' },
    { ...scenes[1], status: 'audio_done' },
  ];
  const partiallyErroredScenes = [
    { ...scenes[0], status: 'audio_done' },
    { ...scenes[1], status: 'audio_error' },
  ];

  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetProject.mockResolvedValue(project);
    mockGetVoices.mockResolvedValue(voices);
    mockUpdateProject.mockResolvedValue(project);
    mockGenerateAudio.mockResolvedValue(generatingScenes);
    mockGetCachedAudioForTrack.mockResolvedValue(null);
    mockSoundCreate.mockResolvedValue({
      sound: { pauseAsync: mockSoundPause, unloadAsync: mockSoundUnload },
    });
    mockSoundPause.mockResolvedValue(undefined);
    mockSoundUnload.mockResolvedValue(undefined);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    jest.useRealTimers();
  });

  const flushAsync = async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  it('polls scenes and audio tracks while at least one scene is generating', async () => {
    mockGetScenes.mockResolvedValue(generatingScenes);
    mockGetAudioTracks.mockResolvedValue([]);

    render(<VoiceSelectScreen />);

    expect(await screen.findByText('Audio w toku: 2')).toBeTruthy();
    expect(mockGetScenes).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await flushAsync();
    expect(mockGetScenes).toHaveBeenCalledTimes(2);
    expect(mockGetAudioTracks).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await flushAsync();
    expect(mockGetScenes).toHaveBeenCalledTimes(3);
    expect(mockGetAudioTracks).toHaveBeenCalledTimes(3);
  });

  it('stops polling and shows success alert when all scenes finish', async () => {
    mockGetScenes
      .mockResolvedValueOnce(generatingScenes)
      .mockResolvedValueOnce(finishedScenes)
      .mockResolvedValue(finishedScenes);
    mockGetAudioTracks.mockResolvedValueOnce([]).mockResolvedValue(tracks);

    render(<VoiceSelectScreen />);

    expect(await screen.findByText('Audio w toku: 2')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await flushAsync();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Generacja audio',
        'Generacja audio zakończona pomyślnie.',
      );
    });

    const callsAfterCompletion = mockGetScenes.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    await flushAsync();
    expect(mockGetScenes).toHaveBeenCalledTimes(callsAfterCompletion);
  });

  it('shows a partial-error alert when some scenes fail and stops polling', async () => {
    mockGetScenes.mockResolvedValueOnce(generatingScenes).mockResolvedValue(partiallyErroredScenes);
    mockGetAudioTracks.mockResolvedValue([]);

    render(<VoiceSelectScreen />);

    expect(await screen.findByText('Audio w toku: 2')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await flushAsync();

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Generacja audio', expect.stringContaining('1 scena'));
    });

    const callsAfterCompletion = mockGetScenes.mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    await flushAsync();
    expect(mockGetScenes).toHaveBeenCalledTimes(callsAfterCompletion);
  });

  it('does not start polling when no scene is generating', async () => {
    mockGetScenes.mockResolvedValue(scenes);
    mockGetAudioTracks.mockResolvedValue(tracks);

    render(<VoiceSelectScreen />);

    expect(await screen.findByText('Gotowe sceny do audio: 1')).toBeTruthy();
    const initialCalls = mockGetScenes.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(9000);
    });
    await flushAsync();

    expect(mockGetScenes).toHaveBeenCalledTimes(initialCalls);
    expect(alertSpy).not.toHaveBeenCalledWith(
      'Generacja audio',
      'Generacja audio zakończona pomyślnie.',
    );
  });
});

describe('VoiceSelectScreen inline track playback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProject.mockResolvedValue(project);
    mockGetVoices.mockResolvedValue(voices);
    mockGetScenes.mockResolvedValue(scenes);
    mockGetAudioTracks.mockResolvedValue(tracksMulti);
    mockUpdateProject.mockResolvedValue(project);
    mockGenerateAudio.mockResolvedValue([]);
    mockGetCachedAudioForTrack.mockResolvedValue(null);
    mockSoundCreate.mockResolvedValue({
      sound: { pauseAsync: mockSoundPause, unloadAsync: mockSoundUnload },
    });
    mockSoundPause.mockResolvedValue(undefined);
    mockSoundUnload.mockResolvedValue(undefined);
  });

  const findPlayButton = async (sceneNumber: number) =>
    await screen.findByLabelText(`Odtwórz scenę ${sceneNumber}`);

  it('plays the streamed audioUrl when no offline cache is available', async () => {
    render(<VoiceSelectScreen />);

    fireEvent.press(await findPlayButton(1));

    await waitFor(() => {
      expect(mockSoundCreate).toHaveBeenCalledTimes(1);
    });
    expect(mockGetCachedAudioForTrack).toHaveBeenCalledWith('proj-1', 'track-1');
    expect(mockSoundCreate).toHaveBeenCalledWith(
      { uri: tracksMulti[0].audioUrl },
      expect.objectContaining({ shouldPlay: true }),
      expect.any(Function),
    );
  });

  it('prefers a local URI from the offline cache when available', async () => {
    mockGetCachedAudioForTrack.mockResolvedValueOnce({ localUri: 'file:///cache/track-1.mp3' });

    render(<VoiceSelectScreen />);

    fireEvent.press(await findPlayButton(1));

    await waitFor(() => {
      expect(mockSoundCreate).toHaveBeenCalledTimes(1);
    });
    expect(mockSoundCreate).toHaveBeenCalledWith(
      { uri: 'file:///cache/track-1.mp3' },
      expect.objectContaining({ shouldPlay: true }),
      expect.any(Function),
    );
  });

  it('pauses the playing track on a second tap without creating a new sound', async () => {
    render(<VoiceSelectScreen />);

    fireEvent.press(await findPlayButton(1));
    await waitFor(() => {
      expect(mockSoundCreate).toHaveBeenCalledTimes(1);
    });

    const pauseBtn = await screen.findByLabelText('Wstrzymaj scenę 1');
    fireEvent.press(pauseBtn);

    await waitFor(() => {
      expect(mockSoundPause).toHaveBeenCalledTimes(1);
    });
    expect(mockSoundCreate).toHaveBeenCalledTimes(1);
  });

  it('switching to another track unloads the previous sound first', async () => {
    render(<VoiceSelectScreen />);

    fireEvent.press(await findPlayButton(1));
    await waitFor(() => {
      expect(mockSoundCreate).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(await findPlayButton(2));

    await waitFor(() => {
      expect(mockSoundCreate).toHaveBeenCalledTimes(2);
    });
    expect(mockSoundUnload).toHaveBeenCalled();
    expect(mockSoundCreate).toHaveBeenLastCalledWith(
      { uri: tracksMulti[1].audioUrl },
      expect.objectContaining({ shouldPlay: true }),
      expect.any(Function),
    );
  });
});
