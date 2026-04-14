import { Router } from 'express';
import { URLSearchParams } from 'url';
import type { SceneResponse, SaveTextRegionsRequest } from '@book-scanner/shared';
import { prisma } from '../lib/db';
import { recognizeText } from '../lib/ocr';
import { requireAuth } from '../middleware/auth';
import { requireProjectOwner } from '../middleware/project-owner';
import { checkPageLimit, incrementPageUsage } from '../lib/limits';
import { signAssetToken } from '../lib/jwt';

export const scenesRouter = Router({ mergeParams: true });

scenesRouter.use(requireAuth);

function buildPageImageUrls(
  pageImage: {
    id: string;
    projectId: string;
    storagePath: string;
    thumbnailPath: string | null;
  },
  req: { protocol: string; get(name: string): string | undefined; user?: { userId: string } },
) {
  const host = req.get('host');
  const baseUrl = host ? `${req.protocol}://${host}` : '';
  const fileToken = signAssetToken({
    userId: req.user!.userId,
    projectId: pageImage.projectId,
    imageId: pageImage.id,
    variant: 'file',
  });
  const thumbnailToken = signAssetToken({
    userId: req.user!.userId,
    projectId: pageImage.projectId,
    imageId: pageImage.id,
    variant: 'thumbnail',
  });

  return {
    imageUrl: baseUrl
      ? `${baseUrl}/projects/${pageImage.projectId}/images/${pageImage.id}/file?${new URLSearchParams({ token: fileToken }).toString()}`
      : pageImage.storagePath,
    thumbnailUrl: baseUrl
      ? `${baseUrl}/projects/${pageImage.projectId}/images/${pageImage.id}/thumbnail?${new URLSearchParams({ token: thumbnailToken }).toString()}`
      : pageImage.thumbnailPath,
  };
}

function toSceneResponse(s: {
  id: string;
  projectId: string;
  pageImageId: string;
  ocrText: string | null;
  editedText: string | null;
  status: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}): SceneResponse {
  return {
    id: s.id,
    projectId: s.projectId,
    pageImageId: s.pageImageId,
    ocrText: s.ocrText,
    editedText: s.editedText,
    status: s.status as SceneResponse['status'],
    orderIndex: s.orderIndex,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

scenesRouter.post('/process-ocr', requireProjectOwner, async (req, res) => {
  const projectId = req.params.projectId;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
    return;
  }

  const images = await prisma.pageImage.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
    include: { textRegions: true },
  });

  if (images.length === 0) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'No images in project. Add photos first.',
      statusCode: 400,
    });
    return;
  }

  const existingScenes = await prisma.scene.findMany({ where: { projectId } });
  const existingImageIds = new Set(existingScenes.map((s) => s.pageImageId));

  const newImages = images.filter((img) => !existingImageIds.has(img.id));

  if (newImages.length > 0) {
    const pageMsg = await checkPageLimit(req.user!.userId, newImages.length);
    if (pageMsg) {
      res.status(403).json({ error: 'Limit exceeded', message: pageMsg, statusCode: 403 });
      return;
    }
  }

  if (newImages.length === 0 && existingScenes.length > 0) {
    const scenes = await prisma.scene.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
    });
    res.status(200).json(scenes.map(toSceneResponse));
    return;
  }

  const lastScene = existingScenes.length > 0
    ? Math.max(...existingScenes.map((s) => s.orderIndex))
    : -1;

  const scenes = [];
  for (let i = 0; i < newImages.length; i++) {
    const scene = await prisma.scene.create({
      data: {
        projectId,
        pageImageId: newImages[i].id,
        status: 'queued',
        orderIndex: lastScene + 1 + i,
      },
    });
    scenes.push(scene);
  }

  await incrementPageUsage(req.user!.userId, newImages.length);

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'ocr_processing' },
  });

  processOcrInBackground(projectId, project.language);

  const allScenes = await prisma.scene.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
  });

  res.status(202).json(allScenes.map(toSceneResponse));
});

async function processOcrInBackground(projectId: string, language: string) {
  const scenes = await prisma.scene.findMany({
    where: { projectId, status: 'queued' },
    orderBy: { orderIndex: 'asc' },
    include: { pageImage: { include: { textRegions: true } } },
  });

  for (const scene of scenes) {
    try {
      await prisma.scene.update({
        where: { id: scene.id },
        data: { status: 'ocr_processing' },
      });

      const regions = scene.pageImage.textRegions.length > 0
        ? scene.pageImage.textRegions.map((r) => ({
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          }))
        : undefined;

      const result = await recognizeText(scene.pageImage.storagePath, language, regions);

      await prisma.scene.update({
        where: { id: scene.id },
        data: { ocrText: result.text, status: 'ocr_done' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown OCR error';
      await prisma.scene.update({
        where: { id: scene.id },
        data: { ocrText: `ERROR: ${message}`, status: 'ocr_error' },
      });
    }
  }

  const remaining = await prisma.scene.count({
    where: { projectId, status: { in: ['queued', 'ocr_processing'] } },
  });

  if (remaining === 0) {
    const hasErrors = await prisma.scene.count({
      where: { projectId, status: 'ocr_error' },
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { status: hasErrors > 0 ? 'draft' : 'ready_for_tts' },
    });
  }
}

scenesRouter.get('/', requireProjectOwner, async (req, res) => {
  const scenes = await prisma.scene.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { orderIndex: 'asc' },
  });

  res.json(scenes.map(toSceneResponse));
});

scenesRouter.get('/:sceneId', requireProjectOwner, async (req, res) => {
  const scene = await prisma.scene.findUnique({
    where: { id: req.params.sceneId },
    include: { pageImage: true },
  });

  if (!scene || scene.projectId !== req.params.projectId) {
    res.status(404).json({ error: 'Not Found', message: 'Scene not found', statusCode: 404 });
    return;
  }

  const urls = buildPageImageUrls(scene.pageImage, req);

  res.json({
    ...toSceneResponse(scene),
    pageImage: {
      id: scene.pageImage.id,
      storagePath: scene.pageImage.storagePath,
      thumbnailPath: scene.pageImage.thumbnailPath,
      imageUrl: urls.imageUrl,
      thumbnailUrl: urls.thumbnailUrl,
      originalFilename: scene.pageImage.originalFilename,
    },
  });
});

scenesRouter.put('/:sceneId', requireProjectOwner, async (req, res) => {
  const scene = await prisma.scene.findUnique({ where: { id: req.params.sceneId } });

  if (!scene || scene.projectId !== req.params.projectId) {
    res.status(404).json({ error: 'Not Found', message: 'Scene not found', statusCode: 404 });
    return;
  }

  const { editedText, status } = req.body as { editedText?: string | null; status?: string };

  const data: Record<string, unknown> = {};
  if (editedText !== undefined) data.editedText = editedText;
  if (status !== undefined) {
    const allowed = ['needs_review', 'ready_for_audio', 'ocr_done'];
    if (!allowed.includes(status)) {
      res.status(400).json({
        error: 'Validation failed',
        message: `Status must be one of: ${allowed.join(', ')}`,
        statusCode: 400,
      });
      return;
    }
    data.status = status;
  }

  const updated = await prisma.scene.update({
    where: { id: req.params.sceneId },
    data,
  });

  res.json(toSceneResponse(updated));
});

scenesRouter.post('/text-regions', requireProjectOwner, async (req, res) => {
  const { regions } = req.body as SaveTextRegionsRequest;

  if (!Array.isArray(regions) || regions.length === 0) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Regions array required',
      statusCode: 400,
    });
    return;
  }

  for (const r of regions) {
    if (!r.pageImageId || typeof r.x !== 'number' || typeof r.y !== 'number' ||
        typeof r.width !== 'number' || typeof r.height !== 'number') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Each region must have pageImageId, x, y, width, height',
        statusCode: 400,
      });
      return;
    }
  }

  const imageIds = [...new Set(regions.map((r) => r.pageImageId))];
  for (const imgId of imageIds) {
    await prisma.textRegion.deleteMany({ where: { pageImageId: imgId } });
  }

  const created = [];
  for (const r of regions) {
    const region = await prisma.textRegion.create({
      data: {
        pageImageId: r.pageImageId,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      },
    });
    created.push(region);
  }

  res.status(201).json(created);
});
