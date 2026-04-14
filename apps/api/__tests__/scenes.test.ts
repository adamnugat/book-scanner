import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscriptionPlan: { create: vi.fn(), findFirst: vi.fn().mockResolvedValue({ planType: 'max', pagesLimit: 1500, projectsLimit: 50 }) },
    usageTracking: { findUnique: vi.fn().mockResolvedValue({ pagesUsed: 0 }), create: vi.fn(), upsert: vi.fn() },
    project: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    projectShare: { findUnique: vi.fn() },
    pageImage: {
      create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(),
      findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(),
    },
    scene: {
      create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(),
      update: vi.fn(), count: vi.fn(),
    },
    textRegion: {
      create: vi.fn(), deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/lib/ocr', () => ({
  recognizeText: vi.fn().mockResolvedValue({ text: 'Recognized text sample', confidence: 0.95 }),
}));

const db = vi.mocked(prisma);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const tokenB = signAccessToken({ userId: 'user-b', email: 'b@test.com' });

const now = new Date();
const projectA = {
  id: 'proj-1', ownerId: 'user-a', title: 'Test', coverUrl: null,
  language: 'pl', voiceId: null, interstitialPreset: null, status: 'draft',
  createdAt: now, updatedAt: now,
};

const img1 = {
  id: 'img-1', projectId: 'proj-1', storagePath: 'projects/proj-1/pages/1.jpg',
  thumbnailPath: null, orderIndex: 0, originalFilename: 'page1.jpg',
  fileSize: 5000, mimeType: 'image/jpeg', createdAt: now, textRegions: [],
};
const img2 = {
  id: 'img-2', projectId: 'proj-1', storagePath: 'projects/proj-1/pages/2.jpg',
  thumbnailPath: null, orderIndex: 1, originalFilename: 'page2.jpg',
  fileSize: 6000, mimeType: 'image/jpeg', createdAt: now, textRegions: [],
};

const scene1 = {
  id: 'scene-1', projectId: 'proj-1', pageImageId: 'img-1',
  ocrText: null, editedText: null, status: 'queued', orderIndex: 0,
  createdAt: now, updatedAt: now,
};
const scene2 = {
  id: 'scene-2', projectId: 'proj-1', pageImageId: 'img-2',
  ocrText: null, editedText: null, status: 'queued', orderIndex: 1,
  createdAt: now, updatedAt: now,
};

describe('Scenes endpoints', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('POST /projects/:projectId/scenes/process-ocr', () => {
    it('T-4.1: creates scenes with queued status → 202', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findMany.mockResolvedValue([img1, img2]);
      db.scene.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([scene1, scene2])
        .mockResolvedValueOnce([
          { ...scene1, status: 'queued', pageImage: { ...img1, textRegions: [] } },
          { ...scene2, status: 'queued', pageImage: { ...img2, textRegions: [] } },
        ]);
      db.scene.create.mockResolvedValueOnce(scene1).mockResolvedValueOnce(scene2);
      db.project.update.mockResolvedValue(projectA);
      db.scene.update.mockResolvedValue({ ...scene1, status: 'ocr_done', ocrText: 'text' });
      db.scene.count.mockResolvedValue(0);

      const res = await request(app)
        .post('/projects/proj-1/scenes/process-ocr')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(202);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].status).toBe('queued');
      expect(res.body[1].status).toBe('queued');
    });

    it('rejects when no images → 400', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findMany.mockResolvedValue([]);

      const res = await request(app)
        .post('/projects/proj-1/scenes/process-ocr')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('No images');
    });

    it('T-4.7: does not duplicate scenes on re-run', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findMany.mockResolvedValue([img1, img2]);
      db.scene.findMany.mockResolvedValue([
        { ...scene1, status: 'ocr_done', ocrText: 'text' },
        { ...scene2, status: 'ocr_done', ocrText: 'text' },
      ]);

      const res = await request(app)
        .post('/projects/proj-1/scenes/process-ocr')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(db.scene.create).not.toHaveBeenCalled();
    });

    it('denies non-owner → 403', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .post('/projects/proj-1/scenes/process-ocr')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /projects/:projectId/scenes', () => {
    it('T-4.8: returns scenes with statuses in order', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findMany.mockResolvedValue([
        { ...scene1, status: 'ocr_done', ocrText: 'Tekst strony 1' },
        { ...scene2, status: 'ocr_processing' },
      ]);

      const res = await request(app)
        .get('/projects/proj-1/scenes')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].status).toBe('ocr_done');
      expect(res.body[0].ocrText).toBe('Tekst strony 1');
      expect(res.body[1].status).toBe('ocr_processing');
      expect(res.body[0].orderIndex).toBeLessThan(res.body[1].orderIndex);
    });
  });

  describe('POST /projects/:projectId/scenes/text-regions', () => {
    it('saves text regions for image', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.textRegion.deleteMany.mockResolvedValue({ count: 0 });
      db.textRegion.create.mockResolvedValue({
        id: 'tr-1', pageImageId: 'img-1', x: 10, y: 20, width: 100, height: 50,
      });

      const res = await request(app)
        .post('/projects/proj-1/scenes/text-regions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          regions: [
            { pageImageId: 'img-1', x: 10, y: 20, width: 100, height: 50 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveLength(1);
      expect(db.textRegion.deleteMany).toHaveBeenCalledWith({ where: { pageImageId: 'img-1' } });
    });

    it('rejects empty regions → 400', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .post('/projects/proj-1/scenes/text-regions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ regions: [] });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /projects/:projectId/scenes/:sceneId', () => {
    it('returns scene with page image data', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findUnique.mockResolvedValue({
        ...scene1,
        status: 'ocr_done',
        ocrText: 'Tekst strony 1',
        pageImage: img1,
      });

      const res = await request(app)
        .get('/projects/proj-1/scenes/scene-1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.ocrText).toBe('Tekst strony 1');
      expect(res.body.pageImage).toBeDefined();
      expect(res.body.pageImage.storagePath).toBe('projects/proj-1/pages/1.jpg');
    });

    it('returns 404 for non-existent scene', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/projects/proj-1/scenes/nope')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /projects/:projectId/scenes/:sceneId', () => {
    it('T-5.2: updates edited_text → 200', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findUnique.mockResolvedValue({ ...scene1, status: 'ocr_done', ocrText: 'Original' });
      db.scene.update.mockResolvedValue({
        ...scene1, status: 'ocr_done', ocrText: 'Original', editedText: 'Poprawiony tekst',
      });

      const res = await request(app)
        .put('/projects/proj-1/scenes/scene-1')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ editedText: 'Poprawiony tekst' });

      expect(res.status).toBe(200);
      expect(res.body.editedText).toBe('Poprawiony tekst');
    });

    it('T-5.5: setting editedText to null uses ocr_text', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findUnique.mockResolvedValue({ ...scene1, status: 'ocr_done', editedText: 'was edited' });
      db.scene.update.mockResolvedValue({
        ...scene1, status: 'ocr_done', ocrText: 'Original', editedText: null,
      });

      const res = await request(app)
        .put('/projects/proj-1/scenes/scene-1')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ editedText: null });

      expect(res.status).toBe(200);
      expect(res.body.editedText).toBeNull();
    });

    it('updates status to ready_for_audio', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findUnique.mockResolvedValue({ ...scene1, status: 'ocr_done' });
      db.scene.update.mockResolvedValue({ ...scene1, status: 'ready_for_audio' });

      const res = await request(app)
        .put('/projects/proj-1/scenes/scene-1')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'ready_for_audio' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready_for_audio');
    });

    it('rejects invalid status → 400', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findUnique.mockResolvedValue({ ...scene1, status: 'ocr_done' });

      const res = await request(app)
        .put('/projects/proj-1/scenes/scene-1')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent scene', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.scene.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put('/projects/proj-1/scenes/nope')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ editedText: 'test' });

      expect(res.status).toBe(404);
    });
  });
});
