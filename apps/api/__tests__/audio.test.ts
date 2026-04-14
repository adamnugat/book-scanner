import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscriptionPlan: { create: vi.fn(), findFirst: vi.fn().mockResolvedValue({ planType: 'max', pagesLimit: 1500, projectsLimit: 50 }) },
    project: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
    projectShare: { findUnique: vi.fn() },
    pageImage: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    scene: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    textRegion: { create: vi.fn(), deleteMany: vi.fn() },
    voiceProfile: { findMany: vi.fn() },
    audioTrack: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/lib/tts', () => ({
  synthesizeSpeech: vi.fn().mockResolvedValue({
    audioBuffer: Buffer.alloc(1024),
    durationMs: 5000,
  }),
}));

vi.mock('../src/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('key'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  downloadFile: vi.fn(),
  fileExists: vi.fn(),
}));

const db = vi.mocked(prisma);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const now = new Date();

const projectA = {
  id: 'proj-1', ownerId: 'user-a', title: 'Test', coverUrl: null,
  language: 'pl', voiceId: 'voice-1', interstitialPreset: null, status: 'ready_for_tts',
  createdAt: now, updatedAt: now,
};

const projectNoVoice = { ...projectA, voiceId: null };

const scene1 = {
  id: 'scene-1', projectId: 'proj-1', pageImageId: 'img-1',
  ocrText: 'Tekst strony pierwszej', editedText: 'Poprawiony tekst', status: 'ready_for_audio',
  orderIndex: 0, createdAt: now, updatedAt: now,
};
const scene2 = {
  id: 'scene-2', projectId: 'proj-1', pageImageId: 'img-2',
  ocrText: 'Tekst strony drugiej', editedText: null, status: 'ready_for_audio',
  orderIndex: 1, createdAt: now, updatedAt: now,
};

const voicePl = {
  id: 'v-1', elevenlabsVoiceId: 'el-voice-1', name: 'Adam', language: 'pl',
  previewUrl: 'https://example.com/adam.mp3',
  isAvailableFree: true, isAvailablePremium: true, isAvailableMax: true,
};
const voiceEn = {
  id: 'v-2', elevenlabsVoiceId: 'el-voice-2', name: 'Rachel', language: 'en',
  previewUrl: 'https://example.com/rachel.mp3',
  isAvailableFree: false, isAvailablePremium: true, isAvailableMax: true,
};

describe('Voices', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-6.1: GET /voices?language=pl → Polish voices', async () => {
    db.voiceProfile.findMany.mockResolvedValue([voicePl]);

    const res = await request(app)
      .get('/voices?language=pl')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Adam');
    expect(res.body[0].language).toBe('pl');
    expect(res.body[0].previewUrl).toBeDefined();
  });

  it('T-6.2: GET /voices?language=en → English voices', async () => {
    db.voiceProfile.findMany.mockResolvedValue([voiceEn]);

    const res = await request(app)
      .get('/voices?language=en')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].language).toBe('en');
  });

  it('T-6.3: voice has preview URL for playback', async () => {
    db.voiceProfile.findMany.mockResolvedValue([voicePl, voiceEn]);

    const res = await request(app)
      .get('/voices')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    for (const v of res.body) {
      expect(v.previewUrl).toBeTruthy();
    }
  });
});

describe('Audio generation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-6.4: POST generate-audio → 202 + scenes with audio_generating', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.scene.findMany
      .mockResolvedValueOnce([scene1, scene2])
      .mockResolvedValueOnce([
        { ...scene1, status: 'audio_generating' },
        { ...scene2, status: 'audio_generating' },
      ]);
    db.scene.update.mockResolvedValue({ ...scene1, status: 'audio_generating' });
    db.audioTrack.findUnique.mockResolvedValue(null);
    db.audioTrack.create.mockResolvedValue({
      id: 'at-1', sceneId: 'scene-1', storagePath: 'audio/1.mp3',
      durationMs: 5000, fileSize: 1024, createdAt: now,
    });
    db.scene.count.mockResolvedValue(0);
    db.project.update.mockResolvedValue(projectA);

    const res = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(202);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects without voice → 400', async () => {
    db.project.findUnique.mockResolvedValue(projectNoVoice);

    const res = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('voice');
  });

  it('rejects when no scenes ready → 400', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.scene.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
  });

  it('T-6.8: re-generation replaces existing tracks', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.scene.findMany
      .mockResolvedValueOnce([{ ...scene1, status: 'ready_for_audio' }])
      .mockResolvedValueOnce([{ ...scene1, status: 'audio_generating' }]);
    db.scene.update.mockResolvedValue({ ...scene1, status: 'audio_generating' });
    db.audioTrack.findUnique.mockResolvedValue({
      id: 'old-at', sceneId: 'scene-1', storagePath: 'old.mp3',
      durationMs: 3000, fileSize: 512, createdAt: now,
    });
    db.audioTrack.delete.mockResolvedValue({} as never);
    db.audioTrack.create.mockResolvedValue({
      id: 'new-at', sceneId: 'scene-1', storagePath: 'new.mp3',
      durationMs: 5000, fileSize: 1024, createdAt: now,
    });
    db.scene.count.mockResolvedValue(0);
    db.project.update.mockResolvedValue(projectA);

    const res = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(202);
    expect(db.audioTrack.delete).toHaveBeenCalledWith({ where: { id: 'old-at' } });
  });
});

describe('Audio tracks', () => {
  it('GET audio-tracks returns tracks for project', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.audioTrack.findMany.mockResolvedValue([
      {
        id: 'at-1', sceneId: 'scene-1', storagePath: 'audio/1.mp3',
        durationMs: 5000, fileSize: 1024, createdAt: now,
        scene: { orderIndex: 0 },
      },
    ]);

    const res = await request(app)
      .get('/projects/proj-1/audio-tracks')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].durationMs).toBe(5000);
  });
});
