import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Image } from 'react-native';

const mockGetImages = jest.fn();
const mockUploadImages = jest.fn();
const mockDeleteImage = jest.fn();
const mockReorderImages = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
const mockLaunchCameraAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();
const mockShowToast = jest.fn();
const mockManipulateAsync = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: (callback: () => void) => {
    const react = require('react');
    react.useEffect(() => {
      callback();
    }, [callback]);
  },
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
    uploadImages: (...args: unknown[]) => mockUploadImages(...args),
    deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
    reorderImages: (...args: unknown[]) => mockReorderImages(...args),
  },
}));

jest.mock('../components/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
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

const heicAssetWithoutMimeType = {
  ...selectedAsset,
  uri: 'file:///local/IMG_0007.HEIC',
  fileName: 'IMG_0007.HEIC',
  mimeType: null,
};

describe('ProjectImagesScreen page photos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetImages.mockResolvedValue(existingImages);
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
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [selectedAsset] });
    mockRequestCameraPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchCameraAsync.mockResolvedValue({ canceled: false, assets: [selectedAsset] });
    mockManipulateAsync.mockResolvedValue({
      uri: 'file:///cache/IMG_0007.jpg',
      width: 1200,
      height: 1600,
    });
  });

  it('shows selected gallery photos in a local preview before uploading', async () => {
    render(<ProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));

    expect(await screen.findByText('Podgląd zdjęć (1)')).toBeTruthy();
    expect(screen.getByText('page-2.jpg')).toBeTruthy();
    expect(mockUploadImages).not.toHaveBeenCalled();
  });

  it('uploads only pending photos after the user confirms the preview', async () => {
    render(<ProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));
    fireEvent.press(await screen.findByText('Wyślij zdjęcia'));

    await waitFor(() => {
      expect(mockUploadImages).toHaveBeenCalledWith('proj-1', [
        { uri: selectedAsset.uri, name: 'page-2.jpg', type: 'image/jpeg' },
      ]);
    });
    expect(await screen.findByText('page-2.jpg')).toBeTruthy();
  });

  it('converts iPhone HEIC gallery assets to JPEG before uploading', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [heicAssetWithoutMimeType],
    });
    mockUploadImages.mockResolvedValue([
      {
        ...existingImages[0],
        id: 'img-heic',
        imageUrl: 'http://api.test/projects/proj-1/images/img-heic/file?token=file-token',
        thumbnailUrl: 'http://api.test/projects/proj-1/images/img-heic/thumbnail?token=thumb-token',
        orderIndex: 1,
        originalFilename: 'IMG_0007.HEIC',
        mimeType: 'image/heic',
      },
    ]);

    render(<ProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));
    fireEvent.press(await screen.findByText('Wyślij zdjęcia'));

    await waitFor(() => {
      expect(mockUploadImages).toHaveBeenCalledWith('proj-1', [
        { uri: 'file:///cache/IMG_0007.jpg', name: 'IMG_0007.jpg', type: 'image/jpeg' },
      ]);
    });
    expect(mockManipulateAsync).toHaveBeenCalledWith(heicAssetWithoutMimeType.uri, [], {
      compress: 0.9,
      format: 'jpeg',
    });
    expect(await screen.findByText('IMG_0007.HEIC')).toBeTruthy();
  });

  it('converts explicit HEIF picker assets to JPEG before uploading', async () => {
    const heifAsset = {
      ...selectedAsset,
      uri: 'file:///local/IMG_0008.heif',
      fileName: 'IMG_0008.heif',
      mimeType: 'image/heif',
    };
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [heifAsset] });
    mockManipulateAsync.mockResolvedValue({
      uri: 'file:///cache/IMG_0008.jpg',
      width: 1200,
      height: 1600,
    });

    render(<ProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));
    fireEvent.press(await screen.findByText('Wyślij zdjęcia'));

    await waitFor(() => {
      expect(mockUploadImages).toHaveBeenCalledWith('proj-1', [
        { uri: 'file:///cache/IMG_0008.jpg', name: 'IMG_0008.jpg', type: 'image/jpeg' },
      ]);
    });
  });

  it('lets users remove a pending photo before upload', async () => {
    render(<ProjectImagesScreen />);

    fireEvent.press(await screen.findByText('Galeria'));
    fireEvent.press(await screen.findByText('Usuń z podglądu'));

    expect(screen.queryByText('Podgląd zdjęć (1)')).toBeNull();
    expect(mockUploadImages).not.toHaveBeenCalled();
  });

  it('shows an image error state when a page preview cannot load', async () => {
    render(<ProjectImagesScreen />);

    await screen.findByText('page1.jpg');
    const image = screen.UNSAFE_getAllByType(Image)[0];
    fireEvent(image, 'error');

    expect(await screen.findByText('Nie można wyświetlić zdjęcia')).toBeTruthy();
  });
});
