import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockLaunchImageLibraryAsync = jest.fn();
const mockUploadImages = jest.fn();
const mockGetImages = jest.fn();
const mockProcessOcrBatch = jest.fn();
const mockGenerateAudio = jest.fn();
const mockGetAudioTracks = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
const mockUploadFileFromAsset = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
  useLocalSearchParams: () => ({ projectId: 'proj-1' }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

jest.mock('../lib/image-upload', () => ({
  uploadFileFromImagePickerAsset: (...args: unknown[]) => mockUploadFileFromAsset(...args),
}));

jest.mock('../lib/api', () => ({
  api: {
    getImages: (...args: unknown[]) => mockGetImages(...args),
    uploadImages: (...args: unknown[]) => mockUploadImages(...args),
    processOcrBatch: (...args: unknown[]) => mockProcessOcrBatch(...args),
    generateAudio: (...args: unknown[]) => mockGenerateAudio(...args),
    getAudioTracks: (...args: unknown[]) => mockGetAudioTracks(...args),
  },
}));

import NewProjectImagesScreen from '../app/(app)/projects/new/images';

const selectedAsset = {
  uri: 'file:///local/page-1.jpg',
  fileName: 'page-1.jpg',
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

const uploadedImage = {
  id: 'img-1',
  projectId: 'proj-1',
  storagePath: 'projects/proj-1/pages/1.jpg',
  thumbnailPath: null,
  imageUrl: 'http://api.test/image.jpg',
  thumbnailUrl: null,
  orderIndex: 0,
  originalFilename: 'page-1.jpg',
  fileSize: 4096,
  mimeType: 'image/jpeg',
  createdAt: '2026-05-11T00:00:00.000Z',
};

describe('New audiobook wizard step 2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetImages.mockResolvedValue([]);
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [selectedAsset] });
    mockUploadFileFromAsset.mockResolvedValue({
      uri: 'file:///cache/page-1.jpg',
      name: 'page-1.jpg',
      type: 'image/jpeg',
    });
    mockUploadImages.mockResolvedValue([uploadedImage]);
    mockProcessOcrBatch.mockResolvedValue([]);
    mockGenerateAudio.mockResolvedValue([
      {
        id: 'scene-1',
        projectId: 'proj-1',
        pageImageId: 'img-1',
        ocrText: 'Page 1',
        editedText: null,
        status: 'audio_generating',
        orderIndex: 0,
        createdAt: '2026-05-11T00:00:00.000Z',
        updatedAt: '2026-05-11T00:00:00.000Z',
      },
    ]);
    mockGetAudioTracks.mockResolvedValue([
      {
        id: 'track-1',
        sceneId: 'scene-1',
        storagePath: 'projects/proj-1/audio/track-1.mp3',
        audioUrl: 'http://api.test/audio.mp3',
        durationMs: 1000,
        fileSize: 1000,
        createdAt: '2026-05-11T00:00:00.000Z',
      },
    ]);
  });

  it('uses automatic mode by default and finishes by opening the player', async () => {
    render(<NewProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));

    expect(await screen.findByText('Konfiguracja automatyczna')).toBeTruthy();
    expect(screen.getByText('Dodano 1 zdjęcie')).toBeTruthy();
    expect(await screen.findByText('Utwórz audiobooka')).toBeTruthy();

    fireEvent.press(screen.getByTestId('wizard-continue'));

    await waitFor(() => {
      expect(mockUploadImages).toHaveBeenCalledWith('proj-1', [
        { uri: 'file:///cache/page-1.jpg', name: 'page-1.jpg', type: 'image/jpeg' },
      ]);
    });
    expect(mockProcessOcrBatch).toHaveBeenCalledWith('proj-1', { markReadyForAudio: true });
    expect(mockGenerateAudio).toHaveBeenCalledWith('proj-1');
    expect(mockGetAudioTracks).toHaveBeenCalledWith('proj-1');
    expect(mockRouterReplace).toHaveBeenCalledWith('/(app)/projects/proj-1/player');
  });

  it('shows advanced photo boxes and sends the user to text review', async () => {
    render(<NewProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));
    fireEvent.press(await screen.findByText('Konfiguracja zaawansowana'));

    expect(await screen.findByText('page-1.jpg')).toBeTruthy();
    expect(screen.getByText('Edytuj obszary po wysłaniu')).toBeTruthy();

    fireEvent.press(screen.getByTestId('wizard-continue'));

    await waitFor(() => {
      expect(mockProcessOcrBatch).toHaveBeenCalledWith('proj-1');
    });
    expect(mockGenerateAudio).not.toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/(app)/projects/new/review?projectId=proj-1');
  });
});
