import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscriptionPlan: { create: vi.fn() },
    project: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    projectShare: { findUnique: vi.fn() },
    pageImage: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    scene: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    textRegion: { create: vi.fn(), deleteMany: vi.fn() },
    voiceProfile: { findMany: vi.fn() },
    audioTrack: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    playlistItem: { create: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
    interstitialPreset: { findFirst: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/lib/tts', () => ({ synthesizeSpeech: vi.fn() }));
vi.mock('../src/lib/storage', () => ({
  uploadFile: vi.fn(), deleteFile: vi.fn(), downloadFile: vi.fn(), fileExists: vi.fn(),
}));

const db = vi.mocked(prisma);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const now = new Date();

const projectA = {
  id: 'proj-1', ownerId: 'user-a', title: 'Test', coverUrl: null,
  language: 'pl', voiceId: 'voice-1', interstitialPreset: 'Soft chime', status: 'completed',
  createdAt: now, updatedAt: now,
};

const track1 = { id: 'at-1', sceneId: 'scene-1', storagePath: 'audio/1.mp3', durationMs: 5000, fileSize: 1024, createdAt: now };
const track2 = { id: 'at-2', sceneId: 'scene-2', storagePath: 'audio/2.mp3', durationMs: 8000, fileSize: 2048, createdAt: now };

const scene1 = {
  id: 'scene-1', projectId: 'proj-1', pageImageId: 'img-1',
  ocrText: 'Tekst 1', editedText: 'Poprawiony 1', status: 'audio_done', orderIndex: 0,
  createdAt: now, updatedAt: now, audioTrack: track1,
};
const scene2 = {
  id: 'scene-2', projectId: 'proj-1', pageImageId: 'img-2',
  ocrText: 'Tekst 2', editedText: null, status: 'audio_done', orderIndex: 1,
  createdAt: now, updatedAt: now, audioTrack: track2,
};

const interstitial = { id: 'int-1', name: 'Soft chime', audioUrl: 'presets/soft-chime.mp3', durationMs: 2000 };

describe('Playlist', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('POST /projects/:id/build-playlist', () => {
    it('T-7.1: builds playlist with scenes and interstitials', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findMany.mockResolvedValue([scene1, scene2]);
      db.playlistItem.deleteMany.mockResolvedValue({ count: 0 });
      db.interstitialPreset.findFirst.mockResolvedValue(interstitial);

      let order = 0;
      db.playlistItem.create.mockImplementation(async (args) => ({
        id: `pl-${++order}`,
        projectId: 'proj-1',
        type: (args as { data: { type: string } }).data.type,
        referenceId: (args as { data: { referenceId: string } }).data.referenceId,
        orderIndex: (args as { data: { orderIndex: number } }).data.orderIndex,
      }));

      const res = await request(app)
        .post('/projects/proj-1/build-playlist')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.itemCount).toBe(3);
      expect(db.playlistItem.create).toHaveBeenCalledTimes(3);

      const calls = db.playlistItem.create.mock.calls;
      expect((calls[0][0] as { data: { type: string } }).data.type).toBe('scene');
      expect((calls[1][0] as { data: { type: string } }).data.type).toBe('interstitial');
      expect((calls[2][0] as { data: { type: string } }).data.type).toBe('scene');
    });

    it('T-7.8: builds playlist without interstitial when none available', async () => {
      db.project.findUnique.mockResolvedValue({ ...projectA, interstitialPreset: null });
      db.scene.findMany.mockResolvedValue([scene1, scene2]);
      db.playlistItem.deleteMany.mockResolvedValue({ count: 0 });
      db.interstitialPreset.findFirst.mockResolvedValue(null);

      let order = 0;
      db.playlistItem.create.mockImplementation(async (args) => ({
        id: `pl-${++order}`,
        projectId: 'proj-1',
        type: (args as { data: { type: string } }).data.type,
        referenceId: (args as { data: { referenceId: string } }).data.referenceId,
        orderIndex: (args as { data: { orderIndex: number } }).data.orderIndex,
      }));

      const res = await request(app)
        .post('/projects/proj-1/build-playlist')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.itemCount).toBe(2);
    });

    it('rejects when no audio scenes → 400', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findMany.mockResolvedValue([]);

      const res = await request(app)
        .post('/projects/proj-1/build-playlist')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /projects/:id/playlist', () => {
    it('T-7.2: returns playlist items with audio URLs', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.playlistItem.findMany.mockResolvedValue([
        { id: 'pl-1', projectId: 'proj-1', type: 'scene', referenceId: 'at-1', orderIndex: 0 },
        { id: 'pl-2', projectId: 'proj-1', type: 'interstitial', referenceId: 'int-1', orderIndex: 1 },
        { id: 'pl-3', projectId: 'proj-1', type: 'scene', referenceId: 'at-2', orderIndex: 2 },
      ]);

      db.audioTrack.findUnique
        .mockResolvedValueOnce({
          ...track1,
          scene: { editedText: 'Poprawiony 1', ocrText: 'Tekst 1', orderIndex: 0 },
        } as never)
        .mockResolvedValueOnce({
          ...track2,
          scene: { editedText: null, ocrText: 'Tekst 2', orderIndex: 1 },
        } as never);

      db.interstitialPreset.findUnique.mockResolvedValue(interstitial);

      const res = await request(app)
        .get('/projects/proj-1/playlist')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body[0].type).toBe('scene');
      expect(res.body[0].audioUrl).toBe('audio/1.mp3');
      expect(res.body[0].sceneText).toBe('Poprawiony 1');
      expect(res.body[1].type).toBe('interstitial');
      expect(res.body[1].audioUrl).toBe('presets/soft-chime.mp3');
      expect(res.body[2].type).toBe('scene');
      expect(res.body[2].sceneText).toBe('Tekst 2');
    });
  });
});
