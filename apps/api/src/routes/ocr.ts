import { Router } from 'express';
import type { SceneResponse } from '@book-scanner/shared';
import { prisma } from '../lib/db';
import { recognizeTextBatch, type OcrBatchInput } from '../lib/ocr';
import { requireAuth } from '../middleware/auth';
import { requireProjectOwner } from '../middleware/project-owner';
import { checkPageLimit, incrementPageUsage } from '../lib/limits';
import { requireRouteParam } from '../lib/route-params';

export const ocrRouter = Router({ mergeParams: true });

ocrRouter.use(requireAuth);

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

ocrRouter.post('/process-ocr-batch', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');
  const markReadyForAudio = req.body?.markReadyForAudio === true;
  const force = req.body?.force === true;
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

  if (force && existingScenes.length > 0) {
    const imageOrderMap = new Map(images.map((img) => [img.id, img.orderIndex]));
    await Promise.all(
      existingScenes.map((scene) =>
        prisma.scene.update({
          where: { id: scene.id },
          data: {
            ocrText: null,
            editedText: null,
            status: 'queued',
            orderIndex: imageOrderMap.get(scene.pageImageId) ?? scene.orderIndex,
          },
        }),
      ),
    );
  }

  const existingImageIds = new Set(existingScenes.map((scene) => scene.pageImageId));
  const newImages = images.filter((image) => !existingImageIds.has(image.id));

  if (newImages.length > 0) {
    const pageLimitMessage = await checkPageLimit(req.user!.userId, newImages.length);
    if (pageLimitMessage) {
      res.status(403).json({ error: 'Limit exceeded', message: pageLimitMessage, statusCode: 403 });
      return;
    }
  }

  const lastSceneOrder = existingScenes.length > 0
    ? Math.max(...existingScenes.map((scene) => scene.orderIndex))
    : -1;

  for (const [index, image] of newImages.entries()) {
    await prisma.scene.create({
      data: {
        projectId,
        pageImageId: image.id,
        status: 'queued',
        orderIndex: lastSceneOrder + 1 + index,
      },
    });
  }

  if (newImages.length > 0) {
    await incrementPageUsage(req.user!.userId, newImages.length);
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'ocr_processing' },
  });

  const scenesToProcess = await prisma.scene.findMany({
    where: {
      projectId,
      OR: [
        { ocrText: null },
        { status: { in: ['queued', 'ocr_error'] } },
      ],
    },
    orderBy: { orderIndex: 'asc' },
    include: { pageImage: { include: { textRegions: { orderBy: { orderIndex: 'asc' } } } } },
  });

  await Promise.all(
    scenesToProcess.map((scene) =>
      prisma.scene.update({
        where: { id: scene.id },
        data: { status: 'ocr_processing' },
      }),
    ),
  );

  const ocrInputs: OcrBatchInput[] = scenesToProcess.map((scene) => ({
    storagePath: scene.pageImage.storagePath,
    regions: scene.pageImage.textRegions.length > 0
      ? scene.pageImage.textRegions.map((region) => ({
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
        }))
      : undefined,
  }));

  const ocrResults = await recognizeTextBatch(ocrInputs, project.language);

  await Promise.all(
    scenesToProcess.map((scene, index) =>
      prisma.scene.update({
        where: { id: scene.id },
        data: {
          ocrText: ocrResults[index]?.text || '',
          status: markReadyForAudio ? 'ready_for_audio' : 'ocr_done',
        },
      }),
    ),
  );

  const remaining = await prisma.scene.count({
    where: { projectId, status: { in: ['queued', 'ocr_processing'] } },
  });

  if (remaining === 0) {
    const hasErrors = await prisma.scene.count({ where: { projectId, status: 'ocr_error' } });
    await prisma.project.update({
      where: { id: projectId },
      data: { status: hasErrors > 0 ? 'draft' : 'ready_for_tts' },
    });
  }

  const scenes = await prisma.scene.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
  });

  res.status(200).json(scenes.map(toSceneResponse));
});
