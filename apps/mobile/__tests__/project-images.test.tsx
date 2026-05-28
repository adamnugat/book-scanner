import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockGetImages = jest.fn();
const mockGetTextRegions = jest.fn();
const mockGetScenes = jest.fn();
const mockGetAudioTracks = jest.fn();
const mockUploadImages = jest.fn();
const mockDeleteImage = jest.fn();
const mockReorderImages = jest.fn();
const mockProcessOcrBatch = jest.fn();
const mockGenerateAudio = jest.fn();
const mockBuildPlaylist = jest.fn();
const mockUpdateScene = jest.fn();
const mockSaveTextRegions = jest.fn();
const mockGetProject = jest.fn();
const mockUpdateProject = jest.fn();
const mockGetVoices = jest.fn();
const mockGetInterstitialPresets = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
const mockLaunchCameraAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();
const mockShowToast = jest.fn();
const mockManipulateAsync = jest.fn();
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    back: jest.fn(),
  },
  useFocusEffect: (callback: () => void) => {
    const react = require('react');
    react.useEffect(() => {
      callback();
    }, [callback]);
  },
  useNavigation: () => ({ setOptions: mockSetOptions }),
  useRouter: () => ({
    push: (...args: unknown[]) => mockRouterPush(...args),
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'proj-1' }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
  launchCameraAsync: (...args: unknown[]) => mockLaunchCameraAsync(...args),
  requestCameraPermissionsAsync: (...args: unknown[]) => mockRequestCameraPermissionsAsync(...args),
}));

jest.mock(
  'expo-image-manipulator',
  () => ({
    manipulateAsync: (...args: unknown[]) => mockManipulateAsync(...args),
    SaveFormat: { JPEG: 'jpeg' },
  }),
  { virtual: true },
);

jest.mock('../lib/api', () => ({
  api: {
    getImages: (...args: unknown[]) => mockGetImages(...args),
    getTextRegions: (...args: unknown[]) => mockGetTextRegions(...args),
    getScenes: (...args: unknown[]) => mockGetScenes(...args),
    getAudioTracks: (...args: unknown[]) => mockGetAudioTracks(...args),
    uploadImages: (...args: unknown[]) => mockUploadImages(...args),
    deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
    reorderImages: (...args: unknown[]) => mockReorderImages(...args),
    processOcrBatch: (...args: unknown[]) => mockProcessOcrBatch(...args),
    generateAudio: (...args: unknown[]) => mockGenerateAudio(...args),
    buildPlaylist: (...args: unknown[]) => mockBuildPlaylist(...args),
    updateScene: (...args: unknown[]) => mockUpdateScene(...args),
    saveTextRegions: (...args: unknown[]) => mockSaveTextRegions(...args),
    getProject: (...args: unknown[]) => mockGetProject(...args),
    updateProject: (...args: unknown[]) => mockUpdateProject(...args),
    getVoices: (...args: unknown[]) => mockGetVoices(...args),
    getInterstitialPresets: (...args: unknown[]) => mockGetInterstitialPresets(...args),
  },
}));

jest.mock('../components/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({ logout: jest.fn(), user: { id: 'u1' } }),
}));

import ProjectImagesScreen from '../app/(app)/projects/[id]/images';

const existingImages = [
  {
    id: 'img-1',
    projectId: 'proj-1',
    storagePath: 'projects/proj-1/pages/1.jpg',
    thumbnailPath: 'projects/proj-1/thumbs/1.webp',
    imageUrl: 'http://api.test/projects/proj-1/images/img-1/file?token=file-token',
    thumbnailUrl: 'http://api.test/projects/proj-1/images/img-1/thumbnail?token=thumb-token',
    orderIndex: 0,
    originalFilename: 'page1.jpg',
    fileSize: 4096,
    mimeType: 'image/jpeg',
    createdAt: '2026-05-05T00:00:00.000Z',
  },
];

const selectedAsset = {
  uri: 'file:///local/page-2.jpg',
  fileName: 'page-2.jpg',
  mimeType: 'image/jpeg',
  width: 1200,
  height: 1600,
  type: 'image' as const,
  assetId: null,
  base64: null,
  duration: null,
  exif: null,
  fileSize: 8192,
};

const doneScene = {
  id: 'scene-1',
  projectId: 'proj-1',
  pageImageId: 'img-1',
  ocrText: 'tekst',
  editedText: null,
  status: 'audio_done',
  orderIndex: 0,
  createdAt: '2026-05-05T00:00:00.000Z',
  updatedAt: '2026-05-05T00:00:00.000Z',
};

const readyScene = { ...doneScene, status: 'ready_for_audio' };

describe('ProjectImagesScreen redesigned workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetImages.mockResolvedValue(existingImages);
    mockGetTextRegions.mockResolvedValue([]);
    mockGetScenes.mockResolvedValue([]);
    mockGetAudioTracks.mockResolvedValue([]);
    mockGetProject.mockResolvedValue({
      id: 'proj-1',
      title: 'Test',
      coverUrl: null,
      language: 'pl',
      voiceId: 'voice-1',
      interstitialPreset: null,
      status: 'draft',
      createdAt: '2026-05-05T00:00:00.000Z',
      updatedAt: '2026-05-05T00:00:00.000Z',
    });
    mockGetVoices.mockResolvedValue([
      {
        id: 'v-1',
        elevenlabsVoiceId: 'voice-1',
        name: 'Anna',
        language: 'pl',
        plan: 'free',
        previewUrl: null,
      },
      {
        id: 'v-2',
        elevenlabsVoiceId: 'voice-2',
        name: 'Bartek',
        language: 'pl',
        plan: 'free',
        previewUrl: null,
      },
    ]);
    mockGetInterstitialPresets.mockResolvedValue([
      {
        id: 'preset-1',
        name: 'Klasyczna',
        audioUrl: 'http://api.test/preset-1.mp3',
        durationMs: 4000,
      },
    ]);
    mockUpdateProject.mockImplementation(async (_id: string, data: Record<string, unknown>) => ({
      id: 'proj-1',
      title: 'Test',
      coverUrl: null,
      language: 'pl',
      voiceId: 'voice-1',
      interstitialPreset: null,
      status: 'draft',
      createdAt: '2026-05-05T00:00:00.000Z',
      updatedAt: '2026-05-05T00:00:00.000Z',
      ...data,
    }));
    mockUploadImages.mockResolvedValue([
      {
        ...existingImages[0],
        id: 'img-2',
        imageUrl: 'http://api.test/projects/proj-1/images/img-2/file?token=file-token',
        thumbnailUrl: 'http://api.test/projects/proj-1/images/img-2/thumbnail?token=thumb-token',
        orderIndex: 1,
        originalFilename: 'page-2.jpg',
      },
    ]);
    mockProcessOcrBatch.mockResolvedValue([]);
    mockGenerateAudio.mockResolvedValue([]);
    mockBuildPlaylist.mockResolvedValue({ message: 'ok', itemCount: 1 });
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [selectedAsset] });
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({ canceled: false, assets: [selectedAsset] });
    mockManipulateAsync.mockResolvedValue({
      uri: 'file:///cache/page-2-optimized.jpg',
      width: 1200,
      height: 1600,
    });
  });

  it('sets the dynamic title to "Edytuj zdjęcia" when images exist', async () => {
    render(<ProjectImagesScreen />);
    await screen.findByText('Zdjęć 1');
    await waitFor(() => {
      expect(mockSetOptions).toHaveBeenCalledWith({ title: 'Edytuj zdjęcia' });
    });
  });

  it('shows the counter bar and general settings toggles when images exist', async () => {
    render(<ProjectImagesScreen />);

    expect(await screen.findByText('Zdjęć 1')).toBeTruthy();
    expect(screen.getByLabelText('Wybór obszarów')).toBeTruthy();
    expect(screen.getByLabelText('Korekta OCR')).toBeTruthy();
  });

  it('uploads gallery photos immediately and shows them in the list (no preview step)', async () => {
    render(<ProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));

    await waitFor(() => {
      expect(mockUploadImages).toHaveBeenCalledWith('proj-1', [
        { uri: 'file:///cache/page-2-optimized.jpg', name: 'page-2.jpg', type: 'image/jpeg' },
      ]);
    });
    // No intermediate preview / confirm button.
    expect(screen.queryByText('Podgląd zdjęć (1)')).toBeNull();
    expect(screen.queryByText('Wyślij zdjęcia')).toBeNull();
    // Newly uploaded page is in the list.
    expect(await screen.findByText('page-2.jpg')).toBeTruthy();
  });

  it('opens the OCR region modal (not a route) when area selection is enabled', async () => {
    render(<ProjectImagesScreen />);

    await screen.findByText('Zdjęć 1');
    fireEvent.press(screen.getByLabelText('Wybór obszarów'));
    fireEvent.press(screen.getByLabelText('Obszary OCR dla page1.jpg'));

    expect(await screen.findByText('Regiony OCR')).toBeTruthy();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('enables submit when an image still needs OCR/TTS (even with no unsaved changes)', async () => {
    // img-1 has no scene yet -> processable, so submit must be available on (re)entry.
    render(<ProjectImagesScreen />);

    const submitBtn = await screen.findByLabelText('Wyślij i przetwórz');
    expect(submitBtn.props.accessibilityState?.disabled).toBe(false);
  });

  it('disables submit when every image is already processed', async () => {
    mockGetScenes.mockResolvedValue([doneScene]); // img-1 -> audio_done

    render(<ProjectImagesScreen />);

    await screen.findByText('Zdjęć 1');
    const submitBtn = screen.getByLabelText('Wyślij i przetwórz');
    expect(submitBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it('runs upload -> OCR -> TTS -> playlist and navigates to audiobook details on submit', async () => {
    mockGetScenes.mockResolvedValue([readyScene]);

    render(<ProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));
    await waitFor(() => expect(mockUploadImages).toHaveBeenCalled());
    fireEvent.press(screen.getByLabelText('Wyślij i przetwórz'));

    await waitFor(() => {
      expect(mockProcessOcrBatch).toHaveBeenCalledWith('proj-1', { markReadyForAudio: true });
      expect(mockGenerateAudio).toHaveBeenCalledWith('proj-1');
      expect(mockBuildPlaylist).toHaveBeenCalledWith('proj-1');
      expect(mockRouterReplace).toHaveBeenCalledWith({
        pathname: '/(app)/projects/[id]',
        params: { id: 'proj-1' },
      });
    });
    expect(mockShowToast).toHaveBeenCalledWith('Wszystkie zdjęcia zostały przetworzone');
  });

  it('stops after OCR for manual correction when correction is enabled', async () => {
    mockGetScenes.mockResolvedValue([{ ...doneScene, status: 'ocr_done' }]);

    render(<ProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));
    await waitFor(() => expect(mockUploadImages).toHaveBeenCalled());
    fireEvent.press(screen.getByLabelText('Korekta OCR'));
    fireEvent.press(screen.getByLabelText('Wyślij i przetwórz'));

    await waitFor(() => {
      expect(mockProcessOcrBatch).toHaveBeenCalledWith('proj-1', { markReadyForAudio: false });
    });
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Tekst rozpoznany — popraw OCR przy zdjęciach, a następnie wyślij ponownie',
      );
    });
    expect(mockGenerateAudio).not.toHaveBeenCalled();
  });

  describe('Audio editing menu', () => {
    it('renders the Audio button alongside the existing toggles', async () => {
      render(<ProjectImagesScreen />);
      await screen.findByText('Zdjęć 1');
      expect(screen.getByLabelText('Edycja audio')).toBeTruthy();
      expect(screen.getByLabelText('Wybór obszarów')).toBeTruthy();
      expect(screen.getByLabelText('Korekta OCR')).toBeTruthy();
    });

    it('opens the audio menu with collapsed accordion sections', async () => {
      render(<ProjectImagesScreen />);
      fireEvent.press(await screen.findByLabelText('Edycja audio'));
      await screen.findByText('Lektor');
      expect(screen.getByText('Wstawka muzyczna')).toBeTruthy();
      // Cards are hidden until accordions are expanded.
      expect(screen.queryByText('Bartek')).toBeNull();
      expect(screen.queryByText('Klasyczna')).toBeNull();
    });

    it('expanding Lektor reveals voice options', async () => {
      render(<ProjectImagesScreen />);
      fireEvent.press(await screen.findByLabelText('Edycja audio'));
      fireEvent.press(await screen.findByLabelText('Edytuj Lektor'));
      expect(await screen.findByText('Bartek')).toBeTruthy();
    });

    it('changing voice calls updateProject with voiceId only and refreshes', async () => {
      mockGetScenes.mockResolvedValue([doneScene]);
      render(<ProjectImagesScreen />);
      await screen.findByText('Zdjęć 1');

      fireEvent.press(screen.getByLabelText('Edycja audio'));
      fireEvent.press(await screen.findByLabelText('Edytuj Lektor'));
      fireEvent.press(await screen.findByTestId('audio-menu-voice-voice-2'));
      fireEvent.press(screen.getByTestId('audio-menu-save'));

      await waitFor(() => {
        expect(mockUpdateProject).toHaveBeenCalledWith('proj-1', { voiceId: 'voice-2' });
      });
      // loadImages re-invoked after voice change → second project fetch
      await waitFor(() => {
        expect(mockGetProject).toHaveBeenCalledTimes(2);
      });
    });

    it('voice change activates submit even when scenes had audio (server now resets them)', async () => {
      mockGetScenes
        .mockResolvedValueOnce([doneScene])
        .mockResolvedValueOnce([readyScene])
        .mockResolvedValue([readyScene]);
      mockGetAudioTracks.mockResolvedValueOnce([]).mockResolvedValue([]);

      render(<ProjectImagesScreen />);
      await screen.findByText('Zdjęć 1');

      let submitBtn = screen.getByLabelText('Wyślij i przetwórz');
      expect(submitBtn.props.accessibilityState?.disabled).toBe(true);

      fireEvent.press(screen.getByLabelText('Edycja audio'));
      fireEvent.press(await screen.findByLabelText('Edytuj Lektor'));
      fireEvent.press(await screen.findByTestId('audio-menu-voice-voice-2'));
      fireEvent.press(screen.getByTestId('audio-menu-save'));

      await waitFor(() => expect(mockUpdateProject).toHaveBeenCalled());

      await waitFor(() => {
        submitBtn = screen.getByLabelText('Wyślij i przetwórz');
        expect(submitBtn.props.accessibilityState?.disabled).toBe(false);
      });

      fireEvent.press(submitBtn);
      await waitFor(() => {
        expect(mockGenerateAudio).toHaveBeenCalledWith('proj-1');
      });
    });

    it('changing interstitial only triggers buildPlaylist on submit (no OCR/TTS)', async () => {
      mockGetScenes.mockResolvedValue([doneScene]);

      render(<ProjectImagesScreen />);
      await screen.findByText('Zdjęć 1');

      fireEvent.press(screen.getByLabelText('Edycja audio'));
      fireEvent.press(await screen.findByLabelText('Edytuj Wstawka muzyczna'));
      fireEvent.press(await screen.findByTestId('audio-menu-preset-preset-1'));
      fireEvent.press(screen.getByTestId('audio-menu-save'));

      await waitFor(() => {
        expect(mockUpdateProject).toHaveBeenCalledWith('proj-1', {
          interstitialPreset: 'preset-1',
        });
      });

      const submitBtn = await screen.findByLabelText('Wyślij i przetwórz');
      await waitFor(() => {
        expect(submitBtn.props.accessibilityState?.disabled).toBe(false);
      });

      fireEvent.press(submitBtn);
      await waitFor(() => {
        expect(mockBuildPlaylist).toHaveBeenCalledWith('proj-1');
      });
      expect(mockProcessOcrBatch).not.toHaveBeenCalled();
      expect(mockGenerateAudio).not.toHaveBeenCalled();
    });

    it('cancel closes menu without saving', async () => {
      render(<ProjectImagesScreen />);
      fireEvent.press(await screen.findByLabelText('Edycja audio'));
      fireEvent.press(await screen.findByLabelText('Edytuj Lektor'));
      fireEvent.press(await screen.findByTestId('audio-menu-voice-voice-2'));
      fireEvent.press(screen.getByTestId('audio-menu-cancel'));

      expect(mockUpdateProject).not.toHaveBeenCalled();
    });
  });
});
