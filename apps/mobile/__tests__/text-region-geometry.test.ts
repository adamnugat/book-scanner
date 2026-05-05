import {
  createNormalizedRegion,
  denormalizeRegion,
} from '../lib/text-region-geometry';

describe('text region geometry helpers', () => {
  it('creates a clamped normalized region from a drag gesture', () => {
    const region = createNormalizedRegion(
      { x: -20, y: 20 },
      { x: 260, y: 140 },
      { width: 200, height: 100 },
    );

    expect(region).toEqual({
      x: 0,
      y: 0.2,
      width: 1,
      height: 0.8,
    });
  });

  it('discards tiny accidental selections', () => {
    const region = createNormalizedRegion(
      { x: 10, y: 10 },
      { x: 15, y: 15 },
      { width: 200, height: 100 },
    );

    expect(region).toBeNull();
  });

  it('maps normalized regions back to preview coordinates', () => {
    const rect = denormalizeRegion(
      { pageImageId: 'img-1', x: 0.25, y: 0.1, width: 0.5, height: 0.4 },
      { width: 200, height: 300 },
    );

    expect(rect).toEqual({ x: 50, y: 30, width: 100, height: 120 });
  });
});
