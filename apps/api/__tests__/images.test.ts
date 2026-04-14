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
    pageImage: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('key'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  downloadFile: vi.fn(),
  fileExists: vi.fn(),
}));

vi.mock('sharp', () => {
  const mockSharp = () => ({
    resize: () => ({
      webp: () => ({
        toBuffer: () => Promise.resolve(Buffer.from('thumb')),
      }),
    }),
  });
  return { default: mockSharp };
});

const db = vi.mocked(prisma);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const tokenB = signAccessToken({ userId: 'user-b', email: 'b@test.com' });

const projectA = {
  id: 'proj-1', ownerId: 'user-a', title: 'Test', coverUrl: null,
  language: 'pl', voiceId: null, interstitialPreset: null, status: 'draft',
  createdAt: new Date(), updatedAt: new Date(),
};

const now = new Date();
const img1 = {
  id: 'img-1', projectId: 'proj-1', storagePath: 'projects/proj-1/pages/1.jpg',
  thumbnailPath: 'projects/proj-1/thumbs/1.webp', orderIndex: 0,
  originalFilename: 'page1.jpg', fileSize: 5000, mimeType: 'image/jpeg', createdAt: now,
};
const img2 = {
  id: 'img-2', projectId: 'proj-1', storagePath: 'projects/proj-1/pages/2.jpg',
  thumbnailPath: 'projects/proj-1/thumbs/2.webp', orderIndex: 1,
  originalFilename: 'page2.jpg', fileSize: 6000, mimeType: 'image/jpeg', createdAt: now,
};

const onePixelJpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkS' +
  'Ew8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJ' +
  'CQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEA' +
  'AAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIh' +
  'MUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6' +
  'Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZ' +
  'mqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx' +
  '8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREA' +
  'AgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAV' +
  'YnLRChYkNOEl8RcYI4Q/RFhHRUMnKC4mNTYpNERERUpHSFZXWFloY2RlZmdoaWpz' +
  'dHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXG' +
  'x8jJytLT1NXW19jZ2uHi4+Tl5ufo6ery8/T19vf4+fr/xAAfAQADAQEBAQEBAQEB' +
  'AAAAAAAAAQIDBAUGBwgJCgv/2gAMAwEAAhEDEQA/AP0poA//2Q==',
  'base64',
);

describe('Image endpoints', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('POST /projects/:projectId/images', () => {
    it('T-3.1: uploads JPEG → 201 + record', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findFirst.mockResolvedValue(null);
      db.pageImage.create.mockResolvedValue(img1);

      const res = await request(app)
        .post('/projects/proj-1/images')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('images', onePixelJpeg, 'page1.jpg');

      expect(res.status).toBe(201);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].originalFilename).toBe('page1.jpg');
    });

    it('T-3.2: rejects .txt file → 400', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .post('/projects/proj-1/images')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('images', Buffer.from('hello'), { filename: 'test.txt', contentType: 'text/plain' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unsupported|Rejected/i);
    });

    it('T-3.7: upload to other user project → 403', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .post('/projects/proj-1/images')
        .set('Authorization', `Bearer ${tokenB}`)
        .attach('images', onePixelJpeg, 'page.jpg');

      expect(res.status).toBe(403);
    });

    it('T-3.9: batch upload 5 files → 5 records', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findFirst.mockResolvedValue(null);
      let callCount = 0;
      db.pageImage.create.mockImplementation(async () => ({
        ...img1,
        id: `img-${++callCount}`,
        orderIndex: callCount - 1,
      }));

      const req = request(app)
        .post('/projects/proj-1/images')
        .set('Authorization', `Bearer ${tokenA}`);

      for (let i = 0; i < 5; i++) {
        req.attach('images', onePixelJpeg, `page${i + 1}.jpg`);
      }

      const res = await req;
      expect(res.status).toBe(201);
      expect(res.body).toHaveLength(5);
    });

    it('rejects request with no files → 400', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .post('/projects/proj-1/images')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /projects/:projectId/images', () => {
    it('T-3.4: returns images in order', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findMany.mockResolvedValue([img1, img2]);

      const res = await request(app)
        .get('/projects/proj-1/images')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].orderIndex).toBe(0);
      expect(res.body[1].orderIndex).toBe(1);
    });
  });

  describe('PUT /projects/:projectId/images/reorder', () => {
    it('T-3.5: reorders images', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.$transaction.mockResolvedValue([]);
      db.pageImage.findMany.mockResolvedValue([
        { ...img2, orderIndex: 0 },
        { ...img1, orderIndex: 1 },
      ]);

      const res = await request(app)
        .put('/projects/proj-1/images/reorder')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ imageIds: ['img-2', 'img-1'] });

      expect(res.status).toBe(200);
      expect(res.body[0].id).toBe('img-2');
      expect(res.body[0].orderIndex).toBe(0);
    });
  });

  describe('DELETE /projects/:projectId/images/:imageId', () => {
    it('T-3.6: deletes image from DB and storage', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findUnique.mockResolvedValue(img1);
      db.pageImage.delete.mockResolvedValue(img1);

      const res = await request(app)
        .delete('/projects/proj-1/images/img-1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
      expect(db.pageImage.delete).toHaveBeenCalledWith({ where: { id: 'img-1' } });
    });

    it('returns 404 for non-existent image', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/projects/proj-1/images/nope')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });
  });
});
