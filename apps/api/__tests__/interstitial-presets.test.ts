import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/db', () => ({
  prisma: {
    interstitialPreset: { findMany: vi.fn() },
  },
}));

const db = vi.mocked(prisma);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });

describe('Interstitial preset endpoints', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns interstitial presets ordered by duration', async () => {
    db.interstitialPreset.findMany.mockResolvedValue([
      { id: 'page-turn', name: 'Page turn', audioUrl: 'presets/page-turn.mp3', durationMs: 1500 },
      { id: 'soft-chime', name: 'Soft chime', audioUrl: 'presets/soft-chime.mp3', durationMs: 2000 },
    ]);

    const res = await request(app)
      .get('/interstitial-presets')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 'page-turn', name: 'Page turn', audioUrl: 'presets/page-turn.mp3', durationMs: 1500 },
      { id: 'soft-chime', name: 'Soft chime', audioUrl: 'presets/soft-chime.mp3', durationMs: 2000 },
    ]);
    expect(db.interstitialPreset.findMany).toHaveBeenCalledWith({
      orderBy: [{ durationMs: 'asc' }, { name: 'asc' }],
    });
  });
});
