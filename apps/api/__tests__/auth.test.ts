import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { hashPassword } from '../src/lib/password';
import { signAccessToken } from '../src/lib/jwt';
import jwt from 'jsonwebtoken';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    subscriptionPlan: {
      create: vi.fn(),
    },
  },
}));

const mockedPrisma = vi.mocked(prisma);

describe('Auth endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('T-1.1: creates user with valid data → 201', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: '$2a$12$hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockedPrisma.subscriptionPlan.create.mockResolvedValue({} as never);

      const res = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'securepass123',
      });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('T-1.2: rejects duplicate email → 409', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'securepass123',
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already registered');
    });

    it('T-1.3: rejects empty password → 400', async () => {
      const res = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: '',
      });

      expect(res.status).toBe(400);
    });

    it('rejects invalid email → 400', async () => {
      const res = await request(app).post('/auth/register').send({
        email: 'not-an-email',
        password: 'securepass123',
      });

      expect(res.status).toBe(400);
    });

    it('T-1.9: password is stored as hash, not plaintext', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.user.create.mockImplementation(async (args: { data: { password: string } }) => {
        expect(args.data.password).not.toBe('securepass123');
        expect(args.data.password).toMatch(/^\$2[aby]\$/);
        return {
          id: 'user-1',
          email: 'test@example.com',
          password: args.data.password,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
      mockedPrisma.subscriptionPlan.create.mockResolvedValue({} as never);

      await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: 'securepass123',
      });

      expect(mockedPrisma.user.create).toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('T-1.4: logs in with valid credentials → 200 + tokens', async () => {
      const hashed = await hashPassword('securepass123');
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'securepass123',
      });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.id).toBe('user-1');
    });

    it('T-1.5: rejects wrong password → 401', async () => {
      const hashed = await hashPassword('securepass123');
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });

    it('rejects non-existent user → 401', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post('/auth/login').send({
        email: 'nobody@example.com',
        password: 'securepass123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('Protected endpoints', () => {
    it('T-1.6: request without token → 401', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('T-1.7: request with valid token → 200', async () => {
      const token = signAccessToken({ userId: 'user-1', email: 'test@example.com' });
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('T-1.8: expired token → 401', async () => {
      const expired = jwt.sign(
        { userId: 'user-1', email: 'test@example.com' },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '0s' },
      );

      const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${expired}`);
      expect(res.status).toBe(401);
    });

    it('malformed token → 401', async () => {
      const res = await request(app).get('/auth/me').set('Authorization', 'Bearer garbage.token.here');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('accepts valid email without revealing existence', async () => {
      const res = await request(app).post('/auth/reset-password').send({ email: 'test@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reset link');
    });

    it('rejects invalid email → 400', async () => {
      const res = await request(app).post('/auth/reset-password').send({ email: 'bad' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('requires auth', async () => {
      const res = await request(app).post('/auth/logout');
      expect(res.status).toBe(401);
    });

    it('succeeds with valid token', async () => {
      const token = signAccessToken({ userId: 'user-1', email: 'test@example.com' });
      const res = await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
