import { Router } from 'express';
import type { RegisterRequest, LoginRequest, AuthResponse, ResetPasswordRequest } from '@book-scanner/shared';
import { prisma } from '../lib/db';
import { hashPassword, comparePassword } from '../lib/password';
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt';
import { validateEmail, validatePassword, collectErrors } from '../lib/validate';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body as RegisterRequest;

  const errors = collectErrors(validateEmail(email), validatePassword(password));
  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', message: errors[0].message, statusCode: 400 });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    res.status(409).json({ error: 'Conflict', message: 'Email already registered', statusCode: 409 });
    return;
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), password: hashed },
  });

  await prisma.subscriptionPlan.create({
    data: { userId: user.id, planType: 'free', pagesLimit: 30, projectsLimit: 1 },
  });

  const payload = { userId: user.id, email: user.email };
  const response: AuthResponse = {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, email: user.email },
  };

  res.status(201).json(response);
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as LoginRequest;

  const errors = collectErrors(validateEmail(email), validatePassword(password));
  if (errors.length > 0) {
    res.status(400).json({ error: 'Validation failed', message: errors[0].message, statusCode: 400 });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password', statusCode: 401 });
    return;
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password', statusCode: 401 });
    return;
  }

  const payload = { userId: user.id, email: user.email };
  const response: AuthResponse = {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, email: user.email },
  };

  res.json(response);
});

authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'Bad Request', message: 'Refresh token required', statusCode: 400 });
    return;
  }

  try {
    const decoded = verifyToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not found', statusCode: 401 });
      return;
    }

    const payload = { userId: user.id, email: user.email };
    const response: AuthResponse = {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user.id, email: user.email },
    };
    res.json(response);
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token', statusCode: 401 });
  }
});

authRouter.post('/logout', requireAuth, (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

authRouter.post('/reset-password', async (req, res) => {
  const { email } = req.body as ResetPasswordRequest;

  const emailError = validateEmail(email);
  if (emailError) {
    res.status(400).json({ error: 'Validation failed', message: emailError.message, statusCode: 400 });
    return;
  }

  // In MVP we acknowledge the request but don't send email.
  // This prevents email enumeration.
  res.json({ message: 'If the email exists, a reset link has been sent' });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: 'Not Found', message: 'User not found', statusCode: 404 });
    return;
  }

  res.json({ user });
});
