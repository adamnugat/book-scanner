import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscriptionPlan: { create: vi.fn(), findFirst: vi.fn() },
    project: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    projectShare: { create: vi.fn(), findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn(), delete: vi.fn() },
    pageImage: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    scene: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    textRegion: { create: vi.fn(), deleteMany: vi.fn() },
    voiceProfile: { findMany: vi.fn() },
    audioTrack: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    playlistItem: { create: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
    interstitialPreset: { findFirst: vi.fn(), findUnique: vi.fn() },
    qrShareLink: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    usageTracking: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('key'), deleteFile: vi.fn(), downloadFile: vi.fn(), fileExists: vi.fn(),
}));
vi.mock('../src/lib/tts', () => ({ synthesizeSpeech: vi.fn() }));
vi.mock('../src/lib/ocr', () => ({ recognizeText: vi.fn().mockResolvedValue({ text: 'test' }) }));

const db = vi.mocked(prisma);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const now = new Date();

const freePlan = { id: 'sp-1', userId: 'user-a', planType: 'free', pagesLimit: 30, projectsLimit: 1, startedAt: now, expiresAt: null };
const premiumPlan = { ...freePlan, planType: 'premium', pagesLimit: 300, projectsLimit: 10 };

const usage0 = { id: 'u-1', userId: 'user-a', periodMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, pagesUsed: 0, charactersProcessed: 0, audioSecondsGenerated: 0, storageUsedBytes: BigInt(0) };
const usage30 = { ...usage0, pagesUsed: 30 };

const projectA = {
  id: 'proj-1', ownerId: 'user-a', title: 'Test', coverUrl: null,
  language: 'pl', voiceId: null, interstitialPreset: null, status: 'draft',
  createdAt: now, updatedAt: now,
};

describe('Pricing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-9.1: GET /pricing → 3 plans', async () => {
    const res = await request(app).get('/pricing');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body.map((p: { type: string }) => p.type)).toEqual(['free', 'premium', 'max']);
    expect(res.body[0].limits.maxActiveProjects).toBe(1);
    expect(res.body[1].limits.maxActiveProjects).toBe(10);
    expect(res.body[2].limits.maxActiveProjects).toBe(50);
  });

  it('T-9.2: GET /me/plan → free for new user', async () => {
    db.subscriptionPlan.findFirst.mockResolvedValue(freePlan);

    const res = await request(app)
      .get('/me/plan')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.planType).toBe('free');
  });

  it('T-9.3: GET /me/usage → usage data', async () => {
    db.subscriptionPlan.findFirst.mockResolvedValue(freePlan);
    db.usageTracking.findUnique.mockResolvedValue(usage0);
    db.project.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/me/usage')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('free');
    expect(res.body.pagesUsed).toBe(0);
    expect(res.body.pagesLimit).toBe(30);
    expect(res.body.projectsUsed).toBe(1);
    expect(res.body.projectsLimit).toBe(1);
  });
});

describe('Project limit enforcement', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-9.4: Free user with 1 project → POST /projects → 403', async () => {
    db.subscriptionPlan.findFirst.mockResolvedValue(freePlan);
    db.project.count.mockResolvedValue(1);

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Second project', language: 'pl' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('limit');
  });

  it('T-9.6: Premium user with 5 projects → POST /projects → 201', async () => {
    db.subscriptionPlan.findFirst.mockResolvedValue(premiumPlan);
    db.project.count.mockResolvedValue(5);
    db.projectShare.findMany.mockResolvedValue([]);
    db.project.create.mockResolvedValue(projectA);

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Sixth project', language: 'pl' });

    expect(res.status).toBe(201);
  });
});

describe('Page limit enforcement', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-9.5: Free user with 30 pages used → process-ocr → 403', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.pageImage.findMany.mockResolvedValue([
      { id: 'img-1', projectId: 'proj-1', storagePath: 'p.jpg', thumbnailPath: null, orderIndex: 0, originalFilename: 'p.jpg', fileSize: 100, mimeType: 'image/jpeg', createdAt: now, textRegions: [] },
    ]);
    db.scene.findMany.mockResolvedValue([]);
    db.subscriptionPlan.findFirst.mockResolvedValue(freePlan);
    db.usageTracking.findUnique.mockResolvedValue(usage30);

    const res = await request(app)
      .post('/projects/proj-1/scenes/process-ocr')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('limit');
  });
});

describe('Voice filtering by plan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-9.7: Free user → only free voices', async () => {
    db.subscriptionPlan.findFirst.mockResolvedValue(freePlan);
    db.voiceProfile.findMany.mockResolvedValue([
      { id: 'v-1', elevenlabsVoiceId: 'el-1', name: 'Adam', language: 'pl', previewUrl: 'u', isAvailableFree: true, isAvailablePremium: true, isAvailableMax: true },
    ]);

    const res = await request(app)
      .get('/voices?language=pl')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(db.voiceProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isAvailableFree: true }) }),
    );
  });

  it('T-9.7: Max user → all voices (no plan filter)', async () => {
    db.subscriptionPlan.findFirst.mockResolvedValue({ ...freePlan, planType: 'max', pagesLimit: 1500, projectsLimit: 50 });
    db.voiceProfile.findMany.mockResolvedValue([
      { id: 'v-1', elevenlabsVoiceId: 'el-1', name: 'Adam', language: 'pl', previewUrl: 'u', isAvailableFree: true, isAvailablePremium: true, isAvailableMax: true },
      { id: 'v-2', elevenlabsVoiceId: 'el-2', name: 'Eve', language: 'pl', previewUrl: 'u', isAvailableFree: false, isAvailablePremium: false, isAvailableMax: true },
    ]);

    const res = await request(app)
      .get('/voices?language=pl')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    const call = db.voiceProfile.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where).not.toHaveProperty('isAvailableFree');
    expect(call.where).not.toHaveProperty('isAvailablePremium');
  });
});
