import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockGetScenes = jest.fn();
const mockUpdateScene = jest.fn();
const mockGenerateAudio = jest.fn();
const mockRouterReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
  useLocalSearchParams: () => ({ projectId: 'proj-1' }),
}));

jest.mock('../lib/api', () => ({
  api: {
    getScenes: (...args: unknown[]) => mockGetScenes(...args),
    updateScene: (...args: unknown[]) => mockUpdateScene(...args),
    generateAudio: (...args: unknown[]) => mockGenerateAudio(...args),
  },
}));

import NewProjectReviewScreen from '../app/(app)/projects/new/review';

const scene = {
  id: 'scene-1',
  projectId: 'proj-1',
  pageImageId: 'img-1',
  ocrText: 'Oryginalny tekst OCR',
  editedText: null,
  status: 'ocr_done',
  orderIndex: 0,
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
};

describe('New audiobook wizard step 3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetScenes.mockResolvedValue([scene]);
    mockUpdateScene.mockResolvedValue({ ...scene, editedText: 'Poprawiony tekst' });
    mockGenerateAudio.mockResolvedValue([]);
  });

  it('lets users edit OCR text before generating audio', async () => {
    render(<NewProjectReviewScreen />);

    expect(await screen.findByText('Krok 3 z 3')).toBeTruthy();
    const input = await screen.findByDisplayValue('Oryginalny tekst OCR');

    fireEvent.changeText(input, 'Poprawiony tekst');
    fireEvent.press(screen.getByText('Zatwierdź i generuj audio'));

    await waitFor(() => {
      expect(mockUpdateScene).toHaveBeenCalledWith('proj-1', 'scene-1', {
        editedText: 'Poprawiony tekst',
        status: 'ready_for_audio',
      });
    });
    expect(mockGenerateAudio).toHaveBeenCalledWith('proj-1');
    expect(mockRouterReplace).toHaveBeenCalledWith('/(app)/projects/proj-1/player');
  });
});
