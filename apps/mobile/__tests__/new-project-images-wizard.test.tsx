import React from 'react';
import { FlatList } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockLaunchImageLibraryAsync = jest.fn();
const mockUploadImages = jest.fn();
const mockGetImages = jest.fn();
const mockProcessOcrBatch = jest.fn();
const mockGenerateAudio = jest.fn();
const mockGetAudioTracks = jest.fn();
const mockGetScenes = jest.fn();
const mockSaveTextRegions = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
const mockUploadFileFromAsset = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args) => mockRouterReplace(...args),
    push: (...args) => mockRouterPush(...args),
  },
  useLocalSearchParams: () => ({ projectId: 'proj-1' }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args) => mockLaunchImageLibraryAsync(...args),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

jest.mock('../lib/image-upload', () => ({
  uploadFileFromImagePickerAsset: (...args) => mockUploadFileFromAsset(...args),
}));

jest.mock('../lib/api', () => ({
  api: {
    getImages: (...args) => mockGetImages(...args),
    uploadImages: (...args) => mockUploadImages(...args),
    processOcrBatch: (...args) => mockProcessOcrBatch(...args),
    generateAudio: (...args) => mockGenerateAudio(...args),
    getAudioTracks: (...args) => mockGetAudioTracks(...args),
    getScenes: (...args) => mockGetScenes(...args),
    saveTextRegions: (...args) => mockSaveTextRegions(...args),
  },
}));

import NewProjectImagesScreen from '../app/(app)/projects/new/images';

const selectedAsset = {
  uri: 'file:///local/page-1.jpg',
  fileName: 'page-1.jpg',
  mimeType: 'image/jpeg',
  width: 1200,
  height: 1600,
  type: 'image',
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

const ocrDoneScene = {
  id: 'scene-1',
  projectId: 'proj-1',
  pageImageId: 'img-1',
  ocrText: 'Page 1',
  editedText: null,
  status: 'ocr_done',
  orderIndex: 0,
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
};

const audioGeneratingScene = {
  ...ocrDoneScene,
  status: 'audio_generating',
};

describe('New audiobook wizard step 2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetImages.mockResolvedValue([]);
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [selectedAsset] });
    mockUploadFileFromAsset.mockResolvedValue({
      uri: 'file:///cache/page-1.jpg',
      name: 'page-1.jpg',
      type: 'image/jpeg',
    });
    mockUploadImages.mockResolvedValue([uploadedImage]);
    mockProcessOcrBatch.mockResolvedValue([]);
    mockGetScenes.mockResolvedValue([ocrDoneScene]);
    mockGenerateAudio.mockResolvedValue([audioGeneratingScene]);
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

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses automatic mode by default and finishes by opening the player', async () => {
    render(<NewProjectImagesScreen />);

    expect(await screen.findByText('Dodaj zdjęcia stron książki')).toBeTruthy();
    expect(screen.getByText('Źródło zdjęć')).toBeTruthy();
    expect(screen.getByText('Wybierz z urządzenia')).toBeTruthy();

    fireEvent.press(await screen.findByText('Galeria'));

    expect(await screen.findByText('Kreator automatyczny')).toBeTruthy();
    expect(screen.getByText('Dodano 1 zdjęcie')).toBeTruthy();
    expect(await screen.findByLabelText('Dalej')).toBeTruthy();

    fireEvent.press(screen.getByTestId('wizard-continue'));

    await waitFor(() => {
      expect(mockUploadImages).toHaveBeenCalledWith('proj-1', [
        { uri: 'file:///cache/page-1.jpg', name: 'page-1.jpg', type: 'image/jpeg' },
      ]);
    });
    expect(mockProcessOcrBatch).toHaveBeenCalledWith('proj-1', { markReadyForAudio: true });
    expect(mockGetScenes).toHaveBeenCalledWith('proj-1');
    expect(mockGenerateAudio).toHaveBeenCalledWith('proj-1');
    expect(mockGetAudioTracks).toHaveBeenCalledWith('proj-1');
    expect(mockRouterReplace).toHaveBeenCalledWith('/(app)/projects/proj-1/player');
  });

  it('waits for OCR to complete before generating audio in auto mode', async () => {
    // First getScenes call returns ocr_processing, second returns ocr_done
    mockGetScenes
      .mockResolvedValueOnce([{ ...ocrDoneScene, status: 'ocr_processing' }])
      .mockResolvedValue([ocrDoneScene]);

    render(<NewProjectImagesScreen />);
    fireEvent.press(await screen.findByText('Galeria'));
    // Wait for image to register in state before pressing continue
    expect(await screen.findByText('Dodano 1 zdjęcie')).toBeTruthy();
    fireEvent.press(screen.getByTestId('wizard-continue'));

    // runAllTimersAsync fires all pending fake timers (including the 1500ms OCR poll delay)
    // and processes the resulting Promise chains
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await waitFor(() => {
      expect(mockGetScenes).toHaveBeenCalledTimes(2);
      expect(mockGenerateAudio).toHaveBeenCalledWith('proj-1');
      expect(mockRouterReplace).toHaveBeenCalledWith('/(app)/projects/proj-1/player');
    });
  });

  it('shows advanced photo boxes and sends the user to text review', async () => {
    render(<NewProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));
    fireEvent.press(await screen.findByText('Kreator zaawansowany'));

    expect(await screen.findByText('page-1.jpg')).toBeTruthy();
    expect(screen.getByLabelText('Wybierz obszary OCR dla page-1.jpg')).toBeTruthy();

    fireEvent.press(screen.getByTestId('wizard-continue'));

    await waitFor(() => {
      expect(mockProcessOcrBatch).toHaveBeenCalledWith('proj-1', { force: true });
    });
    expect(mockGenerateAudio).not.toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/(app)/projects/new/review?projectId=proj-1');
  });

  it('keeps core actions accessible and avoids a nested virtualized photo list', async () => {
    const rendered = render(<NewProjectImagesScreen />);

    const continueButton = await screen.findByTestId('wizard-continue');
    expect(continueButton.props.accessibilityState).toEqual({ disabled: true });
    expect(screen.getByRole('button', { name: 'Galeria' })).toBeTruthy();

    fireEvent.press(screen.getByText('Galeria'));
    fireEvent.press(await screen.findByText('Kreator zaawansowany'));

    expect(
      (await screen.findByLabelText('Przenieś page-1.jpg wyżej')).props.accessibilityState,
    ).toEqual({ disabled: true });
    expect(screen.getByLabelText('Przenieś page-1.jpg niżej').props.accessibilityState).toEqual({
      disabled: true,
    });
    expect(screen.getByLabelText('Usuń page-1.jpg')).toBeTruthy();
    expect(rendered.UNSAFE_queryByType(FlatList)).toBeNull();
  });
});
