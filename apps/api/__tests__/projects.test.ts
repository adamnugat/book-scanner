import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken } from '../src/lib/jwt';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscriptionPlan: { create: vi.fn(), findFirst: vi.fn().mockResolvedValue({ planType: 'max', pagesLimit: 1500, projectsLimit: 50 }) },
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      delete: vi.fn(),
    },
    projectShare: { findUnique: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
  },
}));

const db = vi.mocked(prisma);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const tokenB = signAccessToken({ userId: 'user-b', email: 'b@test.com' });

const now = new Date();
const projectA = {
  id: 'proj-1',
  ownerId: 'user-a',
  title: 'Moja książka',
  coverUrl: null,
  language: 'pl',
  voiceId: null,
  interstitialPreset: null,
  status: 'draft',
  createdAt: now,
  updatedAt: now,
};

describe('Projects CRUD', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('POST /projects', () => {
    it('T-2.1: creates project with valid token → 201', async () => {
      db.project.create.mockResolvedValue(projectA);

      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Moja książka', language: 'pl' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Moja książka');
      expect(res.body.language).toBe('pl');
      expect(res.body.status).toBe('draft');
      expect(res.body.id).toBeDefined();
    });

    it('T-2.6: without token → 401', async () => {
      const res = await request(app)
        .post('/projects')
        .send({ title: 'Test', language: 'pl' });

      expect(res.status).toBe(401);
    });

    it('T-2.7: without required fields → 400', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('rejects invalid language → 400', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Test', language: 'de' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /projects', () => {
    it('T-2.2: returns only projects of current user', async () => {
      db.project.findMany.mockResolvedValue([projectA]);

      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Moja książka');

      expect(db.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: 'user-a' },
        }),
      );
    });

    it('returns empty array when no projects', async () => {
      db.project.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /projects/:id', () => {
    it('returns project for owner', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .get('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('proj-1');
    });

    it('T-2.3: denies access to other user → 403', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.projectShare.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 for non-existent project', async () => {
      db.project.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/projects/nope')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /projects/:id', () => {
    it('T-2.4: updates project fields → 200', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.project.update.mockResolvedValue({ ...projectA, title: 'Nowy tytuł', language: 'en' });

      const res = await request(app)
        .put('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Nowy tytuł', language: 'en' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Nowy tytuł');
      expect(res.body.language).toBe('en');
    });

    it('denies non-owner → 403', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .put('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('rejects empty title → 400', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .put('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('T-2.5: deletes project → 200', async () => {
      db.project.findUnique.mockResolvedValue(projectA);
      db.project.delete.mockResolvedValue(projectA);

      const res = await request(app)
        .delete('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
      expect(db.project.delete).toHaveBeenCalledWith({ where: { id: 'proj-1' } });
    });

    it('denies non-owner delete → 403', async () => {
      db.project.findUnique.mockResolvedValue(projectA);

      const res = await request(app)
        .delete('/projects/proj-1')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });
  });
});
