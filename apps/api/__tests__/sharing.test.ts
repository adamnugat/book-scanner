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
    projectShare: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    pageImage: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    scene: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    textRegion: { create: vi.fn(), deleteMany: vi.fn() },
    voiceProfile: { findMany: vi.fn() },
    audioTrack: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    playlistItem: { create: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
    interstitialPreset: { findFirst: vi.fn(), findUnique: vi.fn() },
    qrShareLink: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('key'),
  deleteFile: vi.fn(), downloadFile: vi.fn(), fileExists: vi.fn(),
}));

vi.mock('../src/lib/tts', () => ({ synthesizeSpeech: vi.fn() }));

vi.mock('qrcode', () => ({
  default: { toBuffer: vi.fn().mockResolvedValue(Buffer.from('PNG')) },
}));

const db = vi.mocked(prisma);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const tokenB = signAccessToken({ userId: 'user-b', email: 'b@test.com' });
const now = new Date();

const projectA = {
  id: 'proj-1', ownerId: 'user-a', title: 'Test', coverUrl: null,
  language: 'pl', voiceId: 'v-1', interstitialPreset: null, status: 'completed',
  createdAt: now, updatedAt: now,
};

const userB = { id: 'user-b', email: 'b@test.com', password: 'hash', createdAt: now, updatedAt: now };

describe('Sharing', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('POST /projects/:id/share', () => {
    it('T-8.1: share with existing user → 201', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.user.findUnique.mockResolvedValue(userB);
      db.projectShare.findUnique.mockResolvedValue(null);
      db.projectShare.create.mockResolvedValue({
        id: 'ps-1', projectId: 'proj-1', sharedWithUserId: 'user-b',
        role: 'viewer', createdAt: now,
      });

      const res = await request(app)
        .post('/projects/proj-1/share')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ email: 'b@test.com' });

      expect(res.status).toBe(201);
      expect(res.body.sharedWithEmail).toBe('b@test.com');
      expect(res.body.role).toBe('viewer');
    });

    it('T-8.2: share with non-existent user → 404', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/projects/proj-1/share')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ email: 'nobody@test.com' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /projects (shared)', () => {
    it('T-8.3: viewer sees shared project in list', async () => {
      db.project.findMany.mockResolvedValue([]);
      db.projectShare.findMany.mockResolvedValue([
        { project: projectA, sharedWithUserId: 'user-b', projectId: 'proj-1', id: 'ps-1', role: 'viewer', createdAt: now },
      ]);

      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe('proj-1');
    });
  });

  describe('Viewer restrictions', () => {
    it('T-8.4: viewer cannot edit → 403', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .put('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('T-8.5: viewer cannot delete → 403', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .delete('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /projects/:id/share/:userId', () => {
    it('T-8.6: owner revokes access → 200', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.projectShare.findUnique.mockResolvedValue({
        id: 'ps-1', projectId: 'proj-1', sharedWithUserId: 'user-b',
        role: 'viewer', createdAt: now,
      });
      db.projectShare.delete.mockResolvedValue({} as never);

      const res = await request(app)
        .delete('/projects/proj-1/share/user-b')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('revoked');
    });

    it('T-8.9: after revocation viewer loses access (tested via project.findUnique flow)', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.projectShare.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });
  });

  describe('QR', () => {
    it('T-8.7: POST /projects/:id/qr → 201 + QR with deep link', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.qrShareLink.findFirst.mockResolvedValue(null);
      db.qrShareLink.create.mockResolvedValue({
        id: 'qr-1', projectId: 'proj-1',
        deepLinkUrl: 'bookscanner://project/proj-1/player',
        qrImageUrl: 'projects/proj-1/qr.png',
        createdAt: now,
      });

      const res = await request(app)
        .post('/projects/proj-1/qr')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(201);
      expect(res.body.deepLinkUrl).toContain('proj-1');
      expect(res.body.qrImageUrl).toBeTruthy();
    });

    it('T-8.8: deep link contains project ID and is valid URL', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.qrShareLink.findFirst.mockResolvedValue(null);
      db.qrShareLink.create.mockResolvedValue({
        id: 'qr-1', projectId: 'proj-1',
        deepLinkUrl: 'bookscanner://project/proj-1/player',
        qrImageUrl: 'projects/proj-1/qr.png',
        createdAt: now,
      });

      const res = await request(app)
        .post('/projects/proj-1/qr')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.body.deepLinkUrl).toMatch(/proj-1/);
      expect(res.body.deepLinkUrl).toMatch(/player/);
      expect(res.body.webFallbackUrl).toMatch(/^http/);
    });
  });
});
