import { Router } from 'express';
import { URLSearchParams } from 'url';
import type {
  SceneResponse,
  SaveTextRegionsRequest,
  TextRegionResponse,
} from '@book-scanner/shared';
import { prisma } from '../lib/db';
import { recognizeText } from '../lib/ocr';
import { requireAuth } from '../middleware/auth';
import { requireProjectOwner } from '../middleware/project-owner';
import { checkPageLimit, incrementPageUsage } from '../lib/limits';
import { deleteFile } from '../lib/storage';
import { signAssetToken } from '../lib/jwt';
import { requireRouteParam } from '../lib/route-params';

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

function toTextRegionResponse(region: {
  id: string;
  pageImageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  orderIndex: number;
}): TextRegionResponse {
  return {
    id: region.id,
    pageImageId: region.pageImageId,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    orderIndex: region.orderIndex,
  };
}

scenesRouter.post('/process-ocr', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
    return;
  }

  const images = await prisma.pageImage.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
    include: { textRegions: { orderBy: { orderIndex: 'asc' } } },
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

  const lastScene =
    existingScenes.length > 0 ? Math.max(...existingScenes.map((s) => s.orderIndex)) : -1;

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
    include: { pageImage: { include: { textRegions: { orderBy: { orderIndex: 'asc' } } } } },
  });

  for (const scene of scenes) {
    try {
      await prisma.scene.update({
        where: { id: scene.id },
        data: { status: 'ocr_processing' },
      });

      const regions =
        scene.pageImage.textRegions.length > 0
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
  const projectId = requireRouteParam(req, 'projectId');
  const scenes = await prisma.scene.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
  });

  res.json(scenes.map(toSceneResponse));
});

scenesRouter.get('/text-regions', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');
  const regions = await prisma.textRegion.findMany({
    where: { pageImage: { projectId } },
    orderBy: [{ pageImage: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
  });

  res.json(regions.map(toTextRegionResponse));
});

scenesRouter.get('/:sceneId', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');
  const sceneId = requireRouteParam(req, 'sceneId');
  const scene = await prisma.scene.findUnique({
    where: { id: sceneId },
    include: { pageImage: true },
  });

  if (!scene || scene.projectId !== projectId) {
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
  const projectId = requireRouteParam(req, 'projectId');
  const sceneId = requireRouteParam(req, 'sceneId');
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });

  if (!scene || scene.projectId !== projectId) {
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

  // Editing the text invalidates any previously generated audio: drop the track (S3 + row)
  // so the scene must be re-synthesised. Re-queue it for audio unless caller set another status.
  if (editedText !== undefined) {
    const audioTrack = await prisma.audioTrack.findUnique({ where: { sceneId } });
    if (audioTrack) {
      try {
        await deleteFile(audioTrack.storagePath);
      } catch (err) {
        console.warn('Failed to delete audio track storage on OCR correction', err);
      }
      await prisma.audioTrack.delete({ where: { id: audioTrack.id } });
      if (data.status === undefined) data.status = 'ready_for_audio';
    }
  }

  const updated = await prisma.scene.update({
    where: { id: sceneId },
    data,
  });

  res.json(toSceneResponse(updated));
});

// Reset a scene's OCR + TTS so it can be reprocessed (e.g. after its OCR regions changed):
// drop generated audio (S3 + row), clear recognised/edited text, re-queue for OCR.
scenesRouter.post('/:sceneId/reset', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');
  const sceneId = requireRouteParam(req, 'sceneId');
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });

  if (!scene || scene.projectId !== projectId) {
    res.status(404).json({ error: 'Not Found', message: 'Scene not found', statusCode: 404 });
    return;
  }

  const audioTrack = await prisma.audioTrack.findUnique({ where: { sceneId } });
  if (audioTrack) {
    try {
      await deleteFile(audioTrack.storagePath);
    } catch (err) {
      console.warn('Failed to delete audio track storage on scene reset', err);
    }
    await prisma.audioTrack.delete({ where: { id: audioTrack.id } });
  }

  const updated = await prisma.scene.update({
    where: { id: sceneId },
    data: { ocrText: null, editedText: null, status: 'queued' },
  });

  res.json(toSceneResponse(updated));
});

scenesRouter.post('/text-regions', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');
  const { regions } = req.body as SaveTextRegionsRequest;

  if (!Array.isArray(regions)) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Regions array required',
      statusCode: 400,
    });
    return;
  }

  for (const r of regions) {
    if (
      !r.pageImageId ||
      typeof r.x !== 'number' ||
      typeof r.y !== 'number' ||
      typeof r.width !== 'number' ||
      typeof r.height !== 'number'
    ) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Each region must have pageImageId, x, y, width, height',
        statusCode: 400,
      });
      return;
    }
  }

  const imageIds = [...new Set(regions.map((r) => r.pageImageId))];
  if (imageIds.length > 0) {
    const projectImages = await prisma.pageImage.findMany({
      where: { projectId, id: { in: imageIds } },
    });
    const ownedImageIds = new Set(projectImages.map((image) => image.id));

    if (imageIds.some((imageId) => !ownedImageIds.has(imageId))) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Each region pageImageId must belong to this project',
        statusCode: 400,
      });
      return;
    }
  }

  await prisma.textRegion.deleteMany({ where: { pageImage: { projectId } } });

  const created = [];
  for (const [orderIndex, r] of regions.entries()) {
    const region = await prisma.textRegion.create({
      data: {
        pageImageId: r.pageImageId,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        orderIndex,
      },
    });
    created.push(region);
  }

  res.status(201).json(created.map(toTextRegionResponse));
});
