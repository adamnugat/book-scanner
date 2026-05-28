import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PageImageCard } from '../components/PageImageCard';

const baseProps = {
  imageId: 'img-1',
  imageUrl: 'http://api.test/img-1.jpg',
  thumbnailUrl: null,
  displayName: 'page-1.jpg',
  pageNumber: 1,
  regionCount: 0,
  onSelectRegions: jest.fn(),
  onCorrectOcr: jest.fn(),
  onDelete: jest.fn(),
};

describe('PageImageCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the three columns: drag handle with ordinal, status icons, delete', () => {
    render(<PageImageCard {...baseProps} pageNumber={2} areaSelectionEnabled />);

    expect(screen.getByLabelText('Przeciągnij page-1.jpg, pozycja 2')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy(); // ordinal in handle
    expect(screen.getByLabelText('Obszary OCR dla page-1.jpg')).toBeTruthy();
    expect(screen.getByLabelText('Korekta OCR dla page-1.jpg')).toBeTruthy();
    expect(screen.getByLabelText('Audio dla page-1.jpg')).toBeTruthy();
    expect(screen.getByLabelText('Usuń page-1.jpg')).toBeTruthy();
  });

  it('does not render reorder arrows', () => {
    render(<PageImageCard {...baseProps} />);

    expect(screen.queryByLabelText('Przenieś page-1.jpg wyżej')).toBeNull();
    expect(screen.queryByLabelText('Przenieś page-1.jpg niżej')).toBeNull();
  });

  it('shows region count badge when regionCount > 0', () => {
    render(<PageImageCard {...baseProps} regionCount={3} areaSelectionEnabled />);

    expect(screen.getByText('3')).toBeTruthy();
  });

  it('greys the region icon with "A" when area selection is disabled', () => {
    render(<PageImageCard {...baseProps} areaSelectionEnabled={false} />);

    const regionIcon = screen.getByLabelText('Obszary OCR dla page-1.jpg');
    expect(regionIcon.props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
  });

  it('greys the OCR icon with "A" when OCR correction is disabled', () => {
    render(<PageImageCard {...baseProps} ocrCorrectionEnabled={false} />);

    const ocrIcon = screen.getByLabelText('Korekta OCR dla page-1.jpg');
    expect(ocrIcon.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('opens region selection when the region icon is pressed and enabled', () => {
    render(<PageImageCard {...baseProps} areaSelectionEnabled regionCount={0} />);

    fireEvent.press(screen.getByLabelText('Obszary OCR dla page-1.jpg'));
    expect(baseProps.onSelectRegions).toHaveBeenCalledWith('img-1');
  });

  it('opens OCR correction when correction is enabled and OCR is done', () => {
    render(<PageImageCard {...baseProps} ocrCorrectionEnabled ocrDone />);

    fireEvent.press(screen.getByLabelText('Korekta OCR dla page-1.jpg'));
    expect(baseProps.onCorrectOcr).toHaveBeenCalledWith('img-1');
  });

  it('keeps the region icon editable after regions are selected (re-entry always works)', () => {
    render(<PageImageCard {...baseProps} areaSelectionEnabled regionCount={2} />);

    const regionIcon = screen.getByLabelText('Obszary OCR dla page-1.jpg');
    expect(regionIcon.props.accessibilityState).toMatchObject({ disabled: false });

    fireEvent.press(regionIcon);
    expect(baseProps.onSelectRegions).toHaveBeenCalledWith('img-1');
  });

  it('marks the audio icon active when audio is assigned', () => {
    render(<PageImageCard {...baseProps} hasAudio />);

    // audio icon is informational (not pressable)
    expect(screen.getByLabelText('Audio dla page-1.jpg').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('invokes delete on trash press', () => {
    render(<PageImageCard {...baseProps} />);

    fireEvent.press(screen.getByLabelText('Usuń page-1.jpg'));
    expect(baseProps.onDelete).toHaveBeenCalledWith('img-1');
  });
});
