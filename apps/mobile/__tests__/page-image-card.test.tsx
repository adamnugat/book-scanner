import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PageImageCard } from '../components/PageImageCard';

const baseProps = {
  imageId: 'img-1',
  imageUrl: 'http://api.test/img-1.jpg',
  thumbnailUrl: null,
  displayName: 'page-1.jpg',
  pageNumber: 1,
  index: 0,
  total: 3,
  regionCount: 0,
  onSelectRegions: jest.fn(),
  onMoveUp: jest.fn(),
  onMoveDown: jest.fn(),
  onDelete: jest.fn(),
};

describe('PageImageCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders four action buttons with stable labels', () => {
    render(<PageImageCard {...baseProps} index={1} />);

    expect(screen.getByLabelText('Wybierz obszary OCR dla page-1.jpg')).toBeTruthy();
    expect(screen.getByLabelText('Przenieś page-1.jpg wyżej')).toBeTruthy();
    expect(screen.getByLabelText('Przenieś page-1.jpg niżej')).toBeTruthy();
    expect(screen.getByLabelText('Usuń page-1.jpg')).toBeTruthy();
  });

  it('disables move-up on the first item', () => {
    render(<PageImageCard {...baseProps} index={0} />);

    expect(
      screen.getByLabelText('Przenieś page-1.jpg wyżej').props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      screen.getByLabelText('Przenieś page-1.jpg niżej').props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });

  it('disables move-down on the last item', () => {
    render(<PageImageCard {...baseProps} index={2} total={3} />);

    expect(
      screen.getByLabelText('Przenieś page-1.jpg wyżej').props.accessibilityState,
    ).toMatchObject({ disabled: false });
    expect(
      screen.getByLabelText('Przenieś page-1.jpg niżej').props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it('invokes callbacks on press', () => {
    render(<PageImageCard {...baseProps} index={1} />);

    fireEvent.press(screen.getByLabelText('Wybierz obszary OCR dla page-1.jpg'));
    fireEvent.press(screen.getByLabelText('Przenieś page-1.jpg wyżej'));
    fireEvent.press(screen.getByLabelText('Przenieś page-1.jpg niżej'));
    fireEvent.press(screen.getByLabelText('Usuń page-1.jpg'));

    expect(baseProps.onSelectRegions).toHaveBeenCalledWith('img-1');
    expect(baseProps.onMoveUp).toHaveBeenCalledWith(1);
    expect(baseProps.onMoveDown).toHaveBeenCalledWith(1);
    expect(baseProps.onDelete).toHaveBeenCalledWith('img-1');
  });

  it('shows region count badge when regionCount > 0', () => {
    render(<PageImageCard {...baseProps} index={1} regionCount={3} />);

    expect(screen.getByText('3')).toBeTruthy();
  });

  it('hides region count badge when regionCount is 0', () => {
    render(<PageImageCard {...baseProps} index={1} regionCount={0} />);

    expect(screen.queryByText('0')).toBeNull();
  });
});
