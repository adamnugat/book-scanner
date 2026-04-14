import { Router } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../lib/db';
import { uploadFile } from '../lib/storage';
import { requireAuth } from '../middleware/auth';
import { requireProjectOwner } from '../middleware/project-owner';

export const sharingRouter = Router({ mergeParams: true });

sharingRouter.use(requireAuth);

sharingRouter.post('/share', requireProjectOwner, async (req, res) => {
  const projectId = req.params.projectId;
  const { email } = req.body as { email: string };

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Validation failed', message: 'Email is required', statusCode: 400 });
    return;
  }

  const targetUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!targetUser) {
    res.status(404).json({ error: 'Not Found', message: 'User not found', statusCode: 404 });
    return;
  }

  if (targetUser.id === req.user!.userId) {
    res.status(400).json({ error: 'Validation failed', message: 'Cannot share with yourself', statusCode: 400 });
    return;
  }

  const existing = await prisma.projectShare.findUnique({
    where: {
      projectId_sharedWithUserId: { projectId, sharedWithUserId: targetUser.id },
    },
  });

  if (existing) {
    res.status(409).json({ error: 'Conflict', message: 'Already shared with this user', statusCode: 409 });
    return;
  }

  const share = await prisma.projectShare.create({
    data: { projectId, sharedWithUserId: targetUser.id, role: 'viewer' },
  });

  res.status(201).json({
    id: share.id,
    projectId: share.projectId,
    sharedWithUserId: share.sharedWithUserId,
    sharedWithEmail: targetUser.email,
    role: share.role,
    createdAt: share.createdAt.toISOString(),
  });
});

sharingRouter.get('/shares', requireProjectOwner, async (req, res) => {
  const shares = await prisma.projectShare.findMany({
    where: { projectId: req.params.projectId },
    include: { sharedWith: { select: { id: true, email: true } } },
  });

  res.json(
    shares.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      sharedWithUserId: s.sharedWithUserId,
      sharedWithEmail: s.sharedWith.email,
      role: s.role,
      createdAt: s.createdAt.toISOString(),
    })),
  );
});

sharingRouter.delete('/share/:userId', requireProjectOwner, async (req, res) => {
  const { projectId, userId } = req.params;

  const share = await prisma.projectShare.findUnique({
    where: { projectId_sharedWithUserId: { projectId, sharedWithUserId: userId } },
  });

  if (!share) {
    res.status(404).json({ error: 'Not Found', message: 'Share not found', statusCode: 404 });
    return;
  }

  await prisma.projectShare.delete({ where: { id: share.id } });

  res.json({ message: 'Access revoked' });
});

sharingRouter.post('/qr', requireProjectOwner, async (req, res) => {
  const projectId = req.params.projectId;
  const appScheme = process.env.APP_SCHEME || 'bookscanner';
  const webUrl = process.env.WEB_URL || 'http://localhost:8081';

  const deepLink = `${appScheme}://project/${projectId}/player`;
  const webFallback = `${webUrl}/projects/${projectId}/player`;

  const qrBuffer = await QRCode.toBuffer(webFallback, { type: 'png', width: 512, margin: 2 });
  const qrPath = `projects/${projectId}/qr-${Date.now()}.png`;
  await uploadFile(qrPath, qrBuffer, 'image/png');

  const existing = await prisma.qrShareLink.findFirst({ where: { projectId } });
  if (existing) {
    await prisma.qrShareLink.delete({ where: { id: existing.id } });
  }

  const qrLink = await prisma.qrShareLink.create({
    data: { projectId, deepLinkUrl: deepLink, qrImageUrl: qrPath },
  });

  res.status(201).json({
    id: qrLink.id,
    projectId: qrLink.projectId,
    deepLinkUrl: qrLink.deepLinkUrl,
    webFallbackUrl: webFallback,
    qrImageUrl: qrLink.qrImageUrl,
    createdAt: qrLink.createdAt.toISOString(),
  });
});

sharingRouter.get('/qr', requireProjectOwner, async (req, res) => {
  const qrLink = await prisma.qrShareLink.findFirst({
    where: { projectId: req.params.projectId },
  });

  if (!qrLink) {
    res.status(404).json({ error: 'Not Found', message: 'QR not generated yet', statusCode: 404 });
    return;
  }

  res.json({
    id: qrLink.id,
    projectId: qrLink.projectId,
    deepLinkUrl: qrLink.deepLinkUrl,
    qrImageUrl: qrLink.qrImageUrl,
    createdAt: qrLink.createdAt.toISOString(),
  });
});
