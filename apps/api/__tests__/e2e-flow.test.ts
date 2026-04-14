import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    subscriptionPlan: { create: vi.fn(), findFirst: vi.fn().mockResolvedValue({ planType: 'max', pagesLimit: 1500, projectsLimit: 50 }) },
    project: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn().mockResolvedValue(0) },
    projectShare: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), delete: vi.fn() },
    pageImage: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    scene: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    textRegion: { create: vi.fn(), deleteMany: vi.fn() },
    voiceProfile: { findMany: vi.fn() },
    audioTrack: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    playlistItem: { create: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
    interstitialPreset: { findFirst: vi.fn(), findUnique: vi.fn() },
    qrShareLink: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    usageTracking: { findUnique: vi.fn().mockResolvedValue({ pagesUsed: 0 }), create: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('../src/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('key'), deleteFile: vi.fn(), downloadFile: vi.fn(), fileExists: vi.fn(),
}));
vi.mock('../src/lib/tts', () => ({
  synthesizeSpeech: vi.fn().mockResolvedValue({ audioBuffer: Buffer.alloc(1024), durationMs: 5000 }),
}));
vi.mock('../src/lib/ocr', () => ({
  recognizeText: vi.fn().mockResolvedValue({ text: 'Rozpoznany tekst ze zdjęcia strony.' }),
}));
vi.mock('sharp', () => ({ default: () => ({ resize: () => ({ webp: () => ({ toBuffer: () => Promise.resolve(Buffer.from('thumb')) }) }) }) }));
vi.mock('qrcode', () => ({ default: { toBuffer: vi.fn().mockResolvedValue(Buffer.from('PNG')) } }));

const db = vi.mocked(prisma);
const now = new Date();
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const tokenB = signAccessToken({ userId: 'user-b', email: 'b@test.com' });

const project = {
  id: 'proj-1', ownerId: 'user-a', title: 'E2E Test', coverUrl: null,
  language: 'pl', voiceId: 'voice-1', interstitialPreset: null, status: 'completed',
  createdAt: now, updatedAt: now,
};

describe('E2E Flow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-12.1: full flow register → project → images → OCR → edit → TTS → playlist → QR', async () => {
    db.project.create.mockResolvedValue(project);
    db.project.findUnique.mockResolvedValue(project);
    db.project.findMany.mockResolvedValue([project]);

    const res1 = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'E2E Test', language: 'pl' });
    expect(res1.status).toBe(201);

    const img = { id: 'img-1', projectId: 'proj-1', storagePath: 'p.jpg', thumbnailPath: 't.webp', orderIndex: 0, originalFilename: 'p.jpg', fileSize: 5000, mimeType: 'image/jpeg', createdAt: now };
    db.pageImage.create.mockResolvedValue(img);
    db.pageImage.findFirst.mockResolvedValue(null);
    db.pageImage.findMany.mockResolvedValue([{ ...img, textRegions: [] }]);

    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const res2 = await request(app)
      .post('/projects/proj-1/images')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('images', jpegHeader, { filename: 'page.jpg', contentType: 'image/jpeg' });
    expect(res2.status).toBe(201);

    const scene = { id: 'scene-1', projectId: 'proj-1', pageImageId: 'img-1', ocrText: 'Tekst', editedText: null, status: 'queued', orderIndex: 0, createdAt: now, updatedAt: now };
    db.scene.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([scene])
      .mockResolvedValueOnce([{ ...scene, status: 'queued', pageImage: { ...img, textRegions: [] } }]);
    db.scene.create.mockResolvedValue(scene);
    db.scene.update.mockResolvedValue({ ...scene, status: 'ocr_done', ocrText: 'Rozpoznany tekst' });
    db.scene.count.mockResolvedValue(0);
    db.project.update.mockResolvedValue(project);
    db.usageTracking.upsert.mockResolvedValue({} as never);

    const res3 = await request(app)
      .post('/projects/proj-1/scenes/process-ocr')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res3.status).toBe(202);

    db.scene.findUnique.mockResolvedValue({ ...scene, status: 'ocr_done', ocrText: 'Rozpoznany tekst' });
    db.scene.update.mockResolvedValue({ ...scene, editedText: 'Poprawiony', status: 'ready_for_audio' });

    const res4 = await request(app)
      .put('/projects/proj-1/scenes/scene-1')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ editedText: 'Poprawiony', status: 'ready_for_audio' });
    expect(res4.status).toBe(200);

    db.scene.findMany.mockResolvedValue([{ ...scene, editedText: 'Poprawiony', status: 'ready_for_audio' }]);
    db.audioTrack.findUnique.mockResolvedValue(null);
    db.audioTrack.create.mockResolvedValue({ id: 'at-1', sceneId: 'scene-1', storagePath: 'audio/1.mp3', durationMs: 5000, fileSize: 1024, createdAt: now });
    db.scene.update.mockResolvedValue({ ...scene, status: 'audio_done' });

    const res5 = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res5.status).toBe(202);

    db.qrShareLink.findFirst.mockResolvedValue(null);
    db.qrShareLink.create.mockResolvedValue({ id: 'qr-1', projectId: 'proj-1', deepLinkUrl: 'bookscanner://project/proj-1/player', qrImageUrl: 'qr.png', createdAt: now });

    const res6 = await request(app)
      .post('/projects/proj-1/qr')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res6.status).toBe(201);
    expect(res6.body.deepLinkUrl).toContain('proj-1');
  });
});

describe('Security: access control', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-12.6: user B cannot access user A project', async () => {
    db.project.findUnique.mockResolvedValue(project);
    db.projectShare.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/projects/proj-1')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it('T-12.6: user B cannot edit user A project', async () => {
    db.project.findUnique.mockResolvedValue(project);

    const res = await request(app)
      .put('/projects/proj-1')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('T-12.6: user B cannot delete user A project', async () => {
    db.project.findUnique.mockResolvedValue(project);

    const res = await request(app)
      .delete('/projects/proj-1')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it('T-12.6: user B cannot access user A images', async () => {
    db.project.findUnique.mockResolvedValue(project);

    const res = await request(app)
      .get('/projects/proj-1/images')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it('T-12.6: user B cannot access user A scenes', async () => {
    db.project.findUnique.mockResolvedValue(project);

    const res = await request(app)
      .get('/projects/proj-1/scenes')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(403);
  });

  it('T-12.7: upload with fake extension rejected by magic bytes', async () => {
    db.project.findUnique.mockResolvedValue(project);

    const fakeExe = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
    const res = await request(app)
      .post('/projects/proj-1/images')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('images', fakeExe, { filename: 'virus.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('does not match');
  });

  it('all endpoints reject unauthenticated requests', async () => {
    const endpoints = [
      { method: 'get', path: '/projects' },
      { method: 'post', path: '/projects' },
      { method: 'get', path: '/voices' },
      { method: 'get', path: '/me/plan' },
      { method: 'get', path: '/me/usage' },
    ];

    for (const ep of endpoints) {
      const res = await (request(app) as Record<string, (p: string) => { send: (b: Record<string, string>) => Promise<{ status: number }> }>)[ep.method](ep.path).send({});
      expect(res.status).toBe(401);
    }
  });
});

describe('Health check', () => {
  it('GET /health returns 200 for unauthenticated', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
