jest.mock('../assets/audio/page-turn-1.mp3', () => 1, { virtual: true });
jest.mock('../assets/audio/page-turn-2.wav', () => 2, { virtual: true });
jest.mock('../assets/audio/page-turn-3.mp3', () => 3, { virtual: true });

import { LOCAL_JINGLES, getLocalJingle, buildPlaylistWithJingles } from '../lib/local-jingles';
import type { PlaylistItemResponse } from '@book-scanner/shared';

describe('LOCAL_JINGLES', () => {
  it('exports three entries', () => {
    expect(LOCAL_JINGLES).toHaveLength(3);
  });

  it('page-turn-1 has bell icon', () => {
    const j = LOCAL_JINGLES.find((x) => x.name === 'local:page-turn-1');
    expect(j?.icon).toBe('🔔');
  });

  it('page-turn-2 has bell icon', () => {
    const j = LOCAL_JINGLES.find((x) => x.name === 'local:page-turn-2');
    expect(j?.icon).toBe('🔔');
  });

  it('page-turn-3 has microphone icon', () => {
    const j = LOCAL_JINGLES.find((x) => x.name === 'local:page-turn-3');
    expect(j?.icon).toBe('🎙️');
  });
});

describe('getLocalJingle', () => {
  it('returns matching entry', () => {
    const j = getLocalJingle('local:page-turn-2');
    expect(j?.name).toBe('local:page-turn-2');
  });

  it('returns undefined for unknown name', () => {
    expect(getLocalJingle('local:unknown')).toBeUndefined();
  });
});

describe('buildPlaylistWithJingles', () => {
  const makeScene = (i: number): PlaylistItemResponse => ({
    id: `scene-${i}`,
    projectId: 'proj-1',
    type: 'scene',
    referenceId: `ref-${i}`,
    orderIndex: i,
    audioUrl: `https://example.com/scene-${i}.mp3`,
    durationMs: 5000,
    sceneOrderIndex: i,
  });

  it('returns scenes unchanged when only one scene', () => {
    const result = buildPlaylistWithJingles([makeScene(0)], 'jingle.mp3');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('scene');
  });

  it('injects jingle between 3 scenes → 5 items', () => {
    const scenes = [makeScene(0), makeScene(1), makeScene(2)];
    const result = buildPlaylistWithJingles(scenes, 'jingle.mp3');
    expect(result).toHaveLength(5);
    expect(result[0].type).toBe('scene');
    expect(result[1].type).toBe('interstitial');
    expect(result[2].type).toBe('scene');
    expect(result[3].type).toBe('interstitial');
    expect(result[4].type).toBe('scene');
  });

  it('jingle items use provided URI', () => {
    const result = buildPlaylistWithJingles([makeScene(0), makeScene(1)], 'file://jingle.mp3');
    const jingles = result.filter((x) => x.type === 'interstitial');
    expect(jingles.every((j) => j.audioUrl === 'file://jingle.mp3')).toBe(true);
  });

  it('jingle not injected after last scene', () => {
    const result = buildPlaylistWithJingles([makeScene(0), makeScene(1)], 'jingle.mp3');
    expect(result[result.length - 1].type).toBe('scene');
  });

  it('returns empty array for empty input', () => {
    expect(buildPlaylistWithJingles([], 'jingle.mp3')).toHaveLength(0);
  });
});
