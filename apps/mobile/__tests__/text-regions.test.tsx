import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockGetImages = jest.fn();
const mockGetTextRegions = jest.fn();
const mockSaveTextRegions = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
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
    getImages: (...args: unknown[]) => mockGetImages(...args),
    getTextRegions: (...args: unknown[]) => mockGetTextRegions(...args),
    saveTextRegions: (...args: unknown[]) => mockSaveTextRegions(...args),
  },
}));

import TextRegionsScreen from '../app/(app)/projects/[id]/text-regions';

const image = {
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
};

describe('TextRegionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetImages.mockResolvedValue([image]);
    mockGetTextRegions.mockResolvedValue([]);
    mockSaveTextRegions.mockResolvedValue([]);
  });

  it('loads saved regions and shows numbered overlays in the editor', async () => {
    mockGetTextRegions.mockResolvedValue([
      { id: 'tr-1', pageImageId: 'img-1', x: 0.1, y: 0.2, width: 0.3, height: 0.4, orderIndex: 0 },
    ]);

    render(<TextRegionsScreen />);

    fireEvent.press(await screen.findByText('Edytuj regiony'));

    expect(await screen.findByText('Strona 1 - regiony OCR')).toBeTruthy();
    expect(screen.getAllByText('Regiony: 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Usuń region 1')).toBeTruthy();
  });

  it('removes a saved region and persists an empty configuration', async () => {
    mockGetTextRegions.mockResolvedValue([
      { id: 'tr-1', pageImageId: 'img-1', x: 0.1, y: 0.2, width: 0.3, height: 0.4, orderIndex: 0 },
    ]);

    render(<TextRegionsScreen />);

    fireEvent.press(await screen.findByText('Edytuj regiony'));
    fireEvent.press(await screen.findByText('Usuń region 1'));
    fireEvent.press(screen.getByText('Zapisz stronę'));
    fireEvent.press(screen.getByText('Dalej →'));

    await waitFor(() => {
      expect(mockSaveTextRegions).toHaveBeenCalledWith('proj-1', []);
    });
  });

  it('saves an empty region list when the user continues without selections', async () => {
    render(<TextRegionsScreen />);

    fireEvent.press(await screen.findByText('Dalej →'));

    await waitFor(() => {
      expect(mockSaveTextRegions).toHaveBeenCalledWith('proj-1', []);
    });
    expect(mockPush).toHaveBeenCalledWith('/(app)/projects/proj-1/scenes');
  });
});
