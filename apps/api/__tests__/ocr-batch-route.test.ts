import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken } from '../src/lib/jwt';

const ocrMocks = vi.hoisted(() => ({
  recognizeTextBatch: vi.fn(),
}));

vi.mock('../src/lib/db', () => ({
  prisma: {
    subscriptionPlan: {
      findFirst: vi
        .fn()
        .mockResolvedValue({ planType: 'max', pagesLimit: 1500, projectsLimit: 50 }),
    },
    usageTracking: {
      findUnique: vi.fn().mockResolvedValue({ pagesUsed: 0 }),
      upsert: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    pageImage: {
      findMany: vi.fn(),
    },
    scene: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../src/lib/ocr', () => ({
  recognizeText: vi.fn(),
  recognizeTextBatch: ocrMocks.recognizeTextBatch,
}));

const db = vi.mocked(prisma);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const tokenB = signAccessToken({ userId: 'user-b', email: 'b@test.com' });
const now = new Date();

const projectA = {
  id: 'proj-1',
  ownerId: 'user-a',
  title: 'Test',
  coverUrl: null,
  language: 'pl',
  voiceId: null,
  interstitialPreset: null,
  status: 'draft',
  createdAt: now,
  updatedAt: now,
};

const img1 = {
  id: 'img-1',
  projectId: 'proj-1',
  storagePath: 'projects/proj-1/pages/1.jpg',
  thumbnailPath: null,
  orderIndex: 0,
  originalFilename: 'page1.jpg',
  fileSize: 5000,
  mimeType: 'image/jpeg',
  createdAt: now,
  textRegions: [],
};

const img2 = {
  id: 'img-2',
  projectId: 'proj-1',
  storagePath: 'projects/proj-1/pages/2.jpg',
  thumbnailPath: null,
  orderIndex: 1,
  originalFilename: 'page2.jpg',
  fileSize: 6000,
  mimeType: 'image/jpeg',
  createdAt: now,
  textRegions: [
    { id: 'tr-1', pageImageId: 'img-2', x: 0.1, y: 0.2, width: 0.7, height: 0.6, orderIndex: 0 },
  ],
};

const scene1 = {
  id: 'scene-1',
  projectId: 'proj-1',
  pageImageId: 'img-1',
  ocrText: null,
  editedText: null,
  status: 'queued',
  orderIndex: 0,
  createdAt: now,
  updatedAt: now,
};

const scene2 = {
  id: 'scene-2',
  projectId: 'proj-1',
  pageImageId: 'img-2',
  ocrText: null,
  editedText: null,
  status: 'queued',
  orderIndex: 1,
  createdAt: now,
  updatedAt: now,
};

describe('POST /projects/:projectId/process-ocr-batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs OCR synchronously for project images and stores text on matching scenes', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.project.update.mockResolvedValue(projectA);
    db.pageImage.findMany.mockResolvedValue([img1, img2]);
    db.scene.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { ...scene1, pageImage: img1 },
        { ...scene2, pageImage: img2 },
      ])
      .mockResolvedValueOnce([
        { ...scene1, status: 'ocr_done', ocrText: 'Page 1' },
        { ...scene2, status: 'ocr_done', ocrText: 'Page 2' },
      ]);
    db.scene.create.mockResolvedValueOnce(scene1).mockResolvedValueOnce(scene2);
    db.scene.update
      .mockResolvedValueOnce({ ...scene1, status: 'ocr_processing' })
      .mockResolvedValueOnce({ ...scene2, status: 'ocr_processing' })
      .mockResolvedValueOnce({ ...scene1, status: 'ocr_done', ocrText: 'Page 1' })
      .mockResolvedValueOnce({ ...scene2, status: 'ocr_done', ocrText: 'Page 2' });
    db.scene.count.mockResolvedValue(0);
    ocrMocks.recognizeTextBatch.mockResolvedValue([{ text: 'Page 1' }, { text: 'Page 2' }]);

    const res = await request(app)
      .post('/projects/proj-1/process-ocr-batch')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(ocrMocks.recognizeTextBatch).toHaveBeenCalledWith(
      [
        { storagePath: 'projects/proj-1/pages/1.jpg', regions: undefined },
        {
          storagePath: 'projects/proj-1/pages/2.jpg',
          regions: [{ x: 0.1, y: 0.2, width: 0.7, height: 0.6 }],
        },
      ],
      'pl',
    );
    expect(db.scene.update).toHaveBeenCalledWith({
      where: { id: 'scene-1' },
      data: { ocrText: 'Page 1', status: 'ocr_done' },
    });
    expect(db.scene.update).toHaveBeenCalledWith({
      where: { id: 'scene-2' },
      data: { ocrText: 'Page 2', status: 'ocr_done' },
    });
    expect(res.body).toHaveLength(2);
    expect(res.body[0].ocrText).toBe('Page 1');
    expect(res.body[1].ocrText).toBe('Page 2');
  });

  it('marks OCR results ready for audio when requested by the automatic wizard flow', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.project.update.mockResolvedValue(projectA);
    db.pageImage.findMany.mockResolvedValue([img1]);
    db.scene.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...scene1, pageImage: img1 }])
      .mockResolvedValueOnce([{ ...scene1, status: 'ready_for_audio', ocrText: 'Page 1' }]);
    db.scene.create.mockResolvedValueOnce(scene1);
    db.scene.update
      .mockResolvedValueOnce({ ...scene1, status: 'ocr_processing' })
      .mockResolvedValueOnce({ ...scene1, status: 'ready_for_audio', ocrText: 'Page 1' });
    db.scene.count.mockResolvedValue(0);
    ocrMocks.recognizeTextBatch.mockResolvedValue([{ text: 'Page 1' }]);

    const res = await request(app)
      .post('/projects/proj-1/process-ocr-batch')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ markReadyForAudio: true });

    expect(res.status).toBe(200);
    expect(db.scene.update).toHaveBeenCalledWith({
      where: { id: 'scene-1' },
      data: { ocrText: 'Page 1', status: 'ready_for_audio' },
    });
  });

  it('denies non-owners', async () => {
    db.project.findUnique.mockResolvedValue(projectA);

    const res = await request(app)
      .post('/projects/proj-1/process-ocr-batch')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(ocrMocks.recognizeTextBatch).not.toHaveBeenCalled();
  });

  it('does not reprocess scenes already ready_for_audio (incremental mode)', async () => {
    const readyScene = {
      ...scene1,
      status: 'ready_for_audio',
      ocrText: 'Already done',
    };
    db.project.findUnique.mockResolvedValue(projectA);
    db.project.update.mockResolvedValue(projectA);
    db.pageImage.findMany.mockResolvedValue([img1]);
    db.scene.findMany
      .mockResolvedValueOnce([readyScene])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([readyScene]);
    db.scene.count.mockResolvedValue(0);
    ocrMocks.recognizeTextBatch.mockResolvedValue([]);

    const res = await request(app)
      .post('/projects/proj-1/process-ocr-batch')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(ocrMocks.recognizeTextBatch).toHaveBeenCalledWith([], 'pl');
    expect(db.scene.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'scene-1' } }),
    );
    expect(db.scene.create).not.toHaveBeenCalled();
  });

  it('does not reprocess scenes already ocr_done (incremental mode)', async () => {
    const doneScene = {
      ...scene1,
      status: 'ocr_done',
      ocrText: 'Already recognized',
    };
    db.project.findUnique.mockResolvedValue(projectA);
    db.project.update.mockResolvedValue(projectA);
    db.pageImage.findMany.mockResolvedValue([img1]);
    db.scene.findMany
      .mockResolvedValueOnce([doneScene])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([doneScene]);
    db.scene.count.mockResolvedValue(0);
    ocrMocks.recognizeTextBatch.mockResolvedValue([]);

    const res = await request(app)
      .post('/projects/proj-1/process-ocr-batch')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(ocrMocks.recognizeTextBatch).toHaveBeenCalledWith([], 'pl');
    expect(db.scene.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'scene-1' } }),
    );
  });

  it('reprocesses scenes in ocr_error status (incremental mode)', async () => {
    const errorScene = {
      ...scene1,
      status: 'ocr_error',
      ocrText: 'ERROR: previous attempt failed',
    };
    db.project.findUnique.mockResolvedValue(projectA);
    db.project.update.mockResolvedValue(projectA);
    db.pageImage.findMany.mockResolvedValue([img1]);
    db.scene.findMany
      .mockResolvedValueOnce([errorScene])
      .mockResolvedValueOnce([{ ...errorScene, pageImage: img1 }])
      .mockResolvedValueOnce([{ ...errorScene, status: 'ocr_done', ocrText: 'Retry success' }]);
    db.scene.update
      .mockResolvedValueOnce({ ...errorScene, status: 'ocr_processing' })
      .mockResolvedValueOnce({ ...errorScene, status: 'ocr_done', ocrText: 'Retry success' });
    db.scene.count.mockResolvedValue(0);
    ocrMocks.recognizeTextBatch.mockResolvedValue([{ text: 'Retry success' }]);

    const res = await request(app)
      .post('/projects/proj-1/process-ocr-batch')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(ocrMocks.recognizeTextBatch).toHaveBeenCalledWith(
      [{ storagePath: 'projects/proj-1/pages/1.jpg', regions: undefined }],
      'pl',
    );
    expect(db.scene.update).toHaveBeenCalledWith({
      where: { id: 'scene-1' },
      data: { ocrText: 'Retry success', status: 'ocr_done' },
    });
  });

  it('creates a Scene for a new PageImage without one (incremental mode)', async () => {
    const existingDoneScene = {
      ...scene1,
      status: 'ocr_done',
      ocrText: 'Old page',
    };
    db.project.findUnique.mockResolvedValue(projectA);
    db.project.update.mockResolvedValue(projectA);
    db.pageImage.findMany.mockResolvedValue([img1, img2]);
    db.scene.findMany
      .mockResolvedValueOnce([existingDoneScene])
      .mockResolvedValueOnce([{ ...scene2, pageImage: img2 }])
      .mockResolvedValueOnce([
        existingDoneScene,
        { ...scene2, status: 'ocr_done', ocrText: 'New page' },
      ]);
    db.scene.create.mockResolvedValueOnce(scene2);
    db.scene.update
      .mockResolvedValueOnce({ ...scene2, status: 'ocr_processing' })
      .mockResolvedValueOnce({ ...scene2, status: 'ocr_done', ocrText: 'New page' });
    db.scene.count.mockResolvedValue(0);
    ocrMocks.recognizeTextBatch.mockResolvedValue([{ text: 'New page' }]);

    const res = await request(app)
      .post('/projects/proj-1/process-ocr-batch')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(db.scene.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj-1',
        pageImageId: 'img-2',
        status: 'queued',
      }),
    });
    expect(db.scene.update).toHaveBeenCalledWith({
      where: { id: 'scene-2' },
      data: { ocrText: 'New page', status: 'ocr_done' },
    });
    expect(db.scene.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'scene-1' } }),
    );
  });
});
