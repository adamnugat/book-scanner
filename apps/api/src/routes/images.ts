import { Router } from 'express';
import { URLSearchParams } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { SUPPORTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '@book-scanner/shared';
import type { ReorderImagesRequest } from '@book-scanner/shared';
import { prisma } from '../lib/db';
import { uploadFile, deleteFile, downloadFileWithMetadata } from '../lib/storage';
import { requireAuth } from '../middleware/auth';
import { requireProjectOwner } from '../middleware/project-owner';
import { validateUploadContent } from '../middleware/validate-upload';
import { signAssetToken, verifyAssetToken } from '../lib/jwt';

export const imagesRouter = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
});

const HEIC_IMAGE_TYPES = new Set(['image/heic', 'image/heif']);

function isHeicImageType(mimeType: string): boolean {
  return HEIC_IMAGE_TYPES.has(mimeType.toLowerCase());
}

async function createPageThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).resize(300, 400, { fit: 'inside' }).webp({ quality: 75 }).toBuffer();
}

function imageResponse(
  img: {
    id: string;
    projectId: string;
    storagePath: string;
    thumbnailPath: string | null;
    orderIndex: number;
    originalFilename: string | null;
    fileSize: number | null;
    mimeType: string | null;
    createdAt: Date;
  },
  req: { protocol: string; get(name: string): string | undefined },
) {
  const host = req.get('host');
  const baseUrl = host ? `${req.protocol}://${host}` : '';
  const fileToken = signAssetToken({
    userId: req.user!.userId,
    projectId: img.projectId,
    imageId: img.id,
    variant: 'file',
  });
  const thumbnailToken = signAssetToken({
    userId: req.user!.userId,
    projectId: img.projectId,
    imageId: img.id,
    variant: 'thumbnail',
  });
  const imageUrl = baseUrl
    ? `${baseUrl}/projects/${img.projectId}/images/${img.id}/file?${new URLSearchParams({ token: fileToken }).toString()}`
    : img.storagePath;
  const thumbnailUrl =
    img.thumbnailPath && baseUrl
      ? `${baseUrl}/projects/${img.projectId}/images/${img.id}/thumbnail?${new URLSearchParams({ token: thumbnailToken }).toString()}`
      : null;

  return {
    id: img.id,
    projectId: img.projectId,
    storagePath: img.storagePath,
    thumbnailPath: img.thumbnailPath,
    imageUrl,
    thumbnailUrl,
    orderIndex: img.orderIndex,
    originalFilename: img.originalFilename,
    fileSize: img.fileSize,
    mimeType: img.mimeType,
    createdAt: img.createdAt.toISOString(),
  };
}

imagesRouter.post(
  '/',
  requireAuth,
  requireProjectOwner,
  upload.array('images', 20),
  validateUploadContent,
  async (req, res) => {
    const projectId = req.params.projectId;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res
        .status(400)
        .json({ error: 'Validation failed', message: 'No files provided', statusCode: 400 });
      return;
    }

    for (const file of files) {
      if (
        !SUPPORTED_IMAGE_TYPES.includes(file.mimetype as (typeof SUPPORTED_IMAGE_TYPES)[number])
      ) {
        res.status(400).json({
          error: 'Validation failed',
          message: `Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, HEIC, HEIF`,
          statusCode: 400,
        });
        return;
      }
    }

    const lastImage = await prisma.pageImage.findFirst({
      where: { projectId },
      orderBy: { orderIndex: 'desc' },
    });
    let nextOrder = (lastImage?.orderIndex ?? -1) + 1;

    const results = [];

    for (const file of files) {
      const fileId = randomUUID();
      const ext = file.originalname.split('.').pop() || 'jpg';
      const storagePath = `projects/${projectId}/pages/${fileId}.${ext}`;
      const thumbPath = `projects/${projectId}/thumbs/${fileId}.webp`;
      let createdThumbnailPath: string | null = null;

      let thumbnailBuffer: Buffer | null = null;
      try {
        thumbnailBuffer = await createPageThumbnail(file.buffer);
      } catch {
        if (isHeicImageType(file.mimetype)) {
          res.status(422).json({
            error: 'Validation failed',
            message: `Cannot generate a preview for "${file.originalname}". HEIC/HEIF images must be convertible to a client-renderable thumbnail.`,
            statusCode: 422,
          });
          return;
        }
      }

      await uploadFile(storagePath, file.buffer, file.mimetype);

      if (thumbnailBuffer) {
        await uploadFile(thumbPath, thumbnailBuffer, 'image/webp');
        createdThumbnailPath = thumbPath;
      }

      const pageImage = await prisma.pageImage.create({
        data: {
          projectId,
          storagePath,
          thumbnailPath: createdThumbnailPath,
          orderIndex: nextOrder++,
          originalFilename: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
        },
      });

      results.push(imageResponse(pageImage, req));
    }

    res.status(201).json(results);
  },
);

imagesRouter.get('/', requireAuth, requireProjectOwner, async (req, res) => {
  const images = await prisma.pageImage.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { orderIndex: 'asc' },
  });

  res.json(images.map((image) => imageResponse(image, req)));
});

imagesRouter.put('/reorder', requireAuth, requireProjectOwner, async (req, res) => {
  const { imageIds } = req.body as ReorderImagesRequest;

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    res
      .status(400)
      .json({ error: 'Validation failed', message: 'imageIds array required', statusCode: 400 });
    return;
  }

  const updates = imageIds.map((id, index) =>
    prisma.pageImage.update({
      where: { id },
      data: { orderIndex: index },
    }),
  );

  await prisma.$transaction(updates);

  const images = await prisma.pageImage.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { orderIndex: 'asc' },
  });

  res.json(images.map((image) => imageResponse(image, req)));
});

imagesRouter.get('/:imageId/file', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : null;
  if (!token) {
    res
      .status(401)
      .json({ error: 'Unauthorized', message: 'Missing asset token', statusCode: 401 });
    return;
  }

  let payload;
  try {
    payload = verifyAssetToken(token);
  } catch {
    res
      .status(401)
      .json({ error: 'Unauthorized', message: 'Invalid asset token', statusCode: 401 });
    return;
  }

  if (
    payload.variant !== 'file' ||
    payload.projectId !== req.params.projectId ||
    payload.imageId !== req.params.imageId
  ) {
    res.status(403).json({ error: 'Forbidden', message: 'Asset token mismatch', statusCode: 403 });
    return;
  }

  const image = await prisma.pageImage.findUnique({ where: { id: req.params.imageId } });
  if (!image || image.projectId !== req.params.projectId) {
    res.status(404).json({ error: 'Not Found', message: 'Image not found', statusCode: 404 });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project || project.ownerId !== payload.userId) {
    res.status(403).json({ error: 'Forbidden', message: 'Access denied', statusCode: 403 });
    return;
  }

  const file = await downloadFileWithMetadata(image.storagePath);
  res.setHeader('Content-Type', file.contentType || image.mimeType || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.send(file.body);
});

imagesRouter.get('/:imageId/thumbnail', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : null;
  if (!token) {
    res
      .status(401)
      .json({ error: 'Unauthorized', message: 'Missing asset token', statusCode: 401 });
    return;
  }

  let payload;
  try {
    payload = verifyAssetToken(token);
  } catch {
    res
      .status(401)
      .json({ error: 'Unauthorized', message: 'Invalid asset token', statusCode: 401 });
    return;
  }

  if (
    payload.variant !== 'thumbnail' ||
    payload.projectId !== req.params.projectId ||
    payload.imageId !== req.params.imageId
  ) {
    res.status(403).json({ error: 'Forbidden', message: 'Asset token mismatch', statusCode: 403 });
    return;
  }

  const image = await prisma.pageImage.findUnique({ where: { id: req.params.imageId } });
  if (!image || image.projectId !== req.params.projectId) {
    res.status(404).json({ error: 'Not Found', message: 'Image not found', statusCode: 404 });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project || project.ownerId !== payload.userId) {
    res.status(403).json({ error: 'Forbidden', message: 'Access denied', statusCode: 403 });
    return;
  }

  const file = await downloadFileWithMetadata(image.thumbnailPath || image.storagePath);
  res.setHeader(
    'Content-Type',
    file.contentType ||
      (image.thumbnailPath ? 'image/webp' : image.mimeType) ||
      'application/octet-stream',
  );
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.send(file.body);
});

imagesRouter.delete('/:imageId', requireAuth, requireProjectOwner, async (req, res) => {
  const image = await prisma.pageImage.findUnique({ where: { id: req.params.imageId } });

  if (!image) {
    res.status(404).json({ error: 'Not Found', message: 'Image not found', statusCode: 404 });
    return;
  }

  if (image.projectId !== req.params.projectId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Image does not belong to this project',
      statusCode: 400,
    });
    return;
  }

  try {
    await deleteFile(image.storagePath);
    if (image.thumbnailPath) await deleteFile(image.thumbnailPath);
  } catch {
    // Storage deletion failed — proceed with DB cleanup
  }

  await prisma.pageImage.delete({ where: { id: req.params.imageId } });

  res.json({ message: 'Image deleted' });
});
