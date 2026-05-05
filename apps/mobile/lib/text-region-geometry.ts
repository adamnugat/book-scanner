import type { TextRegionInput } from '@book-scanner/shared';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

const DEFAULT_MIN_SELECTION_SIZE = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function createNormalizedRegion(
  start: Point,
  end: Point,
  bounds: Size,
  minSelectionSize = DEFAULT_MIN_SELECTION_SIZE,
): Omit<TextRegionInput, 'pageImageId'> | null {
  if (bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  const startX = clamp(start.x, 0, bounds.width);
  const startY = clamp(start.y, 0, bounds.height);
  const endX = clamp(end.x, 0, bounds.width);
  const endY = clamp(end.y, 0, bounds.height);
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  if (width < minSelectionSize || height < minSelectionSize) {
    return null;
  }

  return {
    x: x / bounds.width,
    y: y / bounds.height,
    width: width / bounds.width,
    height: height / bounds.height,
  };
}

export function denormalizeRegion(
  region: Pick<TextRegionInput, 'x' | 'y' | 'width' | 'height'>,
  bounds: Size,
): Rect {
  return {
    x: region.x * bounds.width,
    y: region.y * bounds.height,
    width: region.width * bounds.width,
    height: region.height * bounds.height,
  };
}
