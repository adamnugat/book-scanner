import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { getTextureIndex, ProjectCoverTexture } from '../components/ProjectCoverTexture';

describe('getTextureIndex', () => {
  it('returns same value for same projectId', () => {
    expect(getTextureIndex('abc-123')).toBe(getTextureIndex('abc-123'));
  });

  it('returns values in range 0..9', () => {
    const ids = ['a', 'bb', 'ccc', 'dddd', 'proj-1', 'proj-2', 'z9', 'hello-world', '00', '99'];
    for (const id of ids) {
      const idx = getTextureIndex(id);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(9);
    }
  });

  it('produces different values for IDs with different char sums', () => {
    // 'a' = 97, 'j' = 106 — differ by 9, so indices differ
    const results = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(getTextureIndex));
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('ProjectCoverTexture', () => {
  it('renders without emoji placeholder', () => {
    render(<ProjectCoverTexture projectId="test-id" />);
    expect(screen.queryByText('📖')).toBeNull();
  });

  it('renders the same texture for the same projectId', () => {
    const { toJSON: first } = render(<ProjectCoverTexture projectId="stable-id" />);
    const { toJSON: second } = render(<ProjectCoverTexture projectId="stable-id" />);
    expect(JSON.stringify(first())).toBe(JSON.stringify(second()));
  });
});
