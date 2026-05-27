import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken, signAssetToken } from '../src/lib/jwt';
import { deleteFile, downloadFileWithMetadata, uploadFile } from '../src/lib/storage';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscriptionPlan: { create: vi.fn() },
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectShare: { findUnique: vi.fn() },
    pageImage: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    scene: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('key'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  downloadFile: vi.fn(),
  downloadFileWithMetadata: vi.fn(),
  fileExists: vi.fn(),
}));

const sharpMocks = vi.hoisted(() => ({
  toBuffer: vi.fn(() => Promise.resolve(Buffer.from('thumb'))),
}));

vi.mock('sharp', () => {
  const mockSharp = () => ({
    resize: () => ({
      webp: () => ({
        toBuffer: sharpMocks.toBuffer,
      }),
    }),
  });
  return { default: mockSharp };
});

const db = vi.mocked(prisma);
const storageUploadFile = vi.mocked(uploadFile);
const storageDeleteFile = vi.mocked(deleteFile);
const storageDownloadFileWithMetadata = vi.mocked(downloadFileWithMetadata);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const tokenB = signAccessToken({ userId: 'user-b', email: 'b@test.com' });

const projectA = {
  id: 'proj-1',
  ownerId: 'user-a',
  title: 'Test',
  coverUrl: null,
  language: 'pl',
  voiceId: null,
  interstitialPreset: null,
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const now = new Date();
const img1 = {
  id: 'img-1',
  projectId: 'proj-1',
  storagePath: 'projects/proj-1/pages/1.jpg',
  thumbnailPath: 'projects/proj-1/thumbs/1.webp',
  orderIndex: 0,
  originalFilename: 'page1.jpg',
  fileSize: 5000,
  mimeType: 'image/jpeg',
  createdAt: now,
};
const img2 = {
  id: 'img-2',
  projectId: 'proj-1',
  storagePath: 'projects/proj-1/pages/2.jpg',
  thumbnailPath: 'projects/proj-1/thumbs/2.webp',
  orderIndex: 1,
  originalFilename: 'page2.jpg',
  fileSize: 6000,
  mimeType: 'image/jpeg',
  createdAt: now,
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

const heicLikeImage = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0x00, 0x00, 0x00, 0x00,
]);

describe('Image endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sharpMocks.toBuffer.mockResolvedValue(Buffer.from('thumb'));
    storageDownloadFileWithMetadata.mockResolvedValue({
      body: Buffer.from('asset-bytes'),
      contentType: 'image/webp',
    });
  });

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
        .attach('images', Buffer.from('hello'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unsupported|Rejected/i);
    });

    it('accepts HEIF metadata and returns a protected thumbnail URL', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findFirst.mockResolvedValue(null);
      db.pageImage.create.mockImplementation(async ({ data }) => ({
        ...img1,
        id: 'img-heif',
        storagePath: data.storagePath,
        thumbnailPath: data.thumbnailPath,
        originalFilename: data.originalFilename,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      }));

      const res = await request(app)
        .post('/projects/proj-1/images')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('images', heicLikeImage, { filename: 'page.heif', contentType: 'image/heif' });

      expect(res.status).toBe(201);
      expect(res.body[0]).toMatchObject({
        originalFilename: 'page.heif',
        mimeType: 'image/heif',
      });
      expect(res.body[0].thumbnailUrl).toContain('/thumbnail?token=');
      expect(storageUploadFile).toHaveBeenCalledWith(
        expect.stringContaining('/thumbs/'),
        Buffer.from('thumb'),
        'image/webp',
      );
    });

    it('rejects HEIC uploads when a renderable thumbnail cannot be generated', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findFirst.mockResolvedValue(null);
      sharpMocks.toBuffer.mockRejectedValue(new Error('heif: Unsupported compression'));

      const res = await request(app)
        .post('/projects/proj-1/images')
        .set('Authorization', `Bearer ${tokenA}`)
        .attach('images', heicLikeImage, { filename: 'page.heic', contentType: 'image/heic' });

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/preview|HEIC|HEIF/i);
      expect(db.pageImage.create).not.toHaveBeenCalled();
      expect(storageUploadFile).not.toHaveBeenCalled();
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

  describe('GET /projects/:projectId/images/:imageId/thumbnail', () => {
    it('serves a thumbnail with a valid asset token and no Authorization header', async () => {
      const assetToken = signAssetToken({
        userId: 'user-a',
        projectId: 'proj-1',
        imageId: 'img-1',
        variant: 'thumbnail',
      });
      db.pageImage.findUnique.mockResolvedValue(img1);
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app).get(
        `/projects/proj-1/images/img-1/thumbnail?token=${assetToken}`,
      );

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/webp');
      expect(res.body).toEqual(Buffer.from('asset-bytes'));
    });
  });

  describe('GET /projects/:projectId/images/:imageId/file', () => {
    it('serves the original file with a valid asset token and no Authorization header', async () => {
      const assetToken = signAssetToken({
        userId: 'user-a',
        projectId: 'proj-1',
        imageId: 'img-1',
        variant: 'file',
      });
      db.pageImage.findUnique.mockResolvedValue(img1);
      db.project.findUnique.mockResolvedValue(projectA);
      storageDownloadFileWithMetadata.mockResolvedValue({
        body: Buffer.from('file-bytes'),
        contentType: 'image/jpeg',
      });

      const res = await request(app).get(`/projects/proj-1/images/img-1/file?token=${assetToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/jpeg');
      expect(res.body).toEqual(Buffer.from('file-bytes'));
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

    it('syncs scene order with page order (no OCR/TTS re-run)', async () => {
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
      // scene order updated to match the new page positions
      expect(db.scene.updateMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', pageImageId: 'img-2' },
        data: { orderIndex: 0 },
      });
      expect(db.scene.updateMany).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', pageImageId: 'img-1' },
        data: { orderIndex: 1 },
      });
    });
  });

  describe('DELETE /projects/:projectId/images/:imageId', () => {
    it('T-3.6: deletes image from DB and storage', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findUnique.mockResolvedValue({ ...img1, scene: null });
      db.pageImage.delete.mockResolvedValue(img1);

      const res = await request(app)
        .delete('/projects/proj-1/images/img-1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
      expect(db.pageImage.delete).toHaveBeenCalledWith({ where: { id: 'img-1' } });
    });

    it('deletes audio track storage when image has linked AudioTrack', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findUnique.mockResolvedValue({
        ...img1,
        scene: {
          id: 'scene-1',
          audioTrack: {
            id: 'track-1',
            storagePath: 'projects/proj-1/audio/track-1.mp3',
          },
        },
      });
      db.pageImage.delete.mockResolvedValue(img1);

      const res = await request(app)
        .delete('/projects/proj-1/images/img-1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(storageDeleteFile).toHaveBeenCalledWith('projects/proj-1/audio/track-1.mp3');
      expect(storageDeleteFile).toHaveBeenCalledWith('projects/proj-1/pages/1.jpg');
      expect(storageDeleteFile).toHaveBeenCalledWith('projects/proj-1/thumbs/1.webp');
      expect(db.pageImage.delete).toHaveBeenCalledWith({ where: { id: 'img-1' } });
    });

    it('skips audio deletion when image has no scene', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findUnique.mockResolvedValue({ ...img1, scene: null });
      db.pageImage.delete.mockResolvedValue(img1);

      const res = await request(app)
        .delete('/projects/proj-1/images/img-1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(storageDeleteFile).not.toHaveBeenCalledWith(expect.stringContaining('/audio/'));
    });

    it('still deletes DB record when audio storage cleanup throws', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      db.project.findUnique.mockResolvedValue(projectA);
      db.pageImage.findUnique.mockResolvedValue({
        ...img1,
        scene: {
          id: 'scene-1',
          audioTrack: {
            id: 'track-1',
            storagePath: 'projects/proj-1/audio/track-1.mp3',
          },
        },
      });
      db.pageImage.delete.mockResolvedValue(img1);
      storageDeleteFile.mockImplementationOnce(() => Promise.reject(new Error('S3 down')));

      const res = await request(app)
        .delete('/projects/proj-1/images/img-1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
      expect(db.pageImage.delete).toHaveBeenCalledWith({ where: { id: 'img-1' } });
      warnSpy.mockRestore();
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
