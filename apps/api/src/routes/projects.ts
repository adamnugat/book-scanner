import { Router } from 'express';
import type { CreateProjectRequest, UpdateProjectRequest } from '@book-scanner/shared';
import { SUPPORTED_LANGUAGES } from '@book-scanner/shared';
import { prisma } from '../lib/db';
import { requireAuth } from '../middleware/auth';
import { checkProjectLimit } from '../lib/limits';
import { deleteFile } from '../lib/storage';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

function toResponse(p: {
  id: string;
  title: string;
  coverUrl: string | null;
  language: string;
  voiceId: string | null;
  interstitialPreset: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    title: p.title,
    coverUrl: p.coverUrl,
    language: p.language,
    voiceId: p.voiceId,
    interstitialPreset: p.interstitialPreset,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

projectsRouter.post('/', async (req, res) => {
  const { title, language, coverUrl, voiceId, interstitialPreset } =
    req.body as CreateProjectRequest;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res
      .status(400)
      .json({ error: 'Validation failed', message: 'Title is required', statusCode: 400 });
    return;
  }

  if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Language must be "pl" or "en"',
      statusCode: 400,
    });
    return;
  }

  const limitMsg = await checkProjectLimit(req.user!.userId);
  if (limitMsg) {
    res.status(403).json({ error: 'Limit exceeded', message: limitMsg, statusCode: 403 });
    return;
  }

  const project = await prisma.project.create({
    data: {
      ownerId: req.user!.userId,
      title: title.trim(),
      language,
      coverUrl: coverUrl || null,
      voiceId: voiceId || null,
      interstitialPreset: interstitialPreset || null,
    },
  });

  res.status(201).json(toResponse(project));
});

projectsRouter.get('/', async (req, res) => {
  const ownProjects = await prisma.project.findMany({
    where: { ownerId: req.user!.userId },
    orderBy: { updatedAt: 'desc' },
  });

  const sharedWithMe = await prisma.projectShare.findMany({
    where: { sharedWithUserId: req.user!.userId },
    include: { project: true },
  });

  const sharedProjects = sharedWithMe.map((s) => s.project);
  const allProjects = [...ownProjects, ...sharedProjects];
  allProjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  res.json(allProjects.map(toResponse));
});

projectsRouter.get('/:id', async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });

  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
    return;
  }

  if (project.ownerId !== req.user!.userId) {
    const share = await prisma.projectShare.findUnique({
      where: {
        projectId_sharedWithUserId: {
          projectId: project.id,
          sharedWithUserId: req.user!.userId,
        },
      },
    });
    if (!share) {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied', statusCode: 403 });
      return;
    }
  }

  res.json(toResponse(project));
});

projectsRouter.put('/:id', async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });

  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
    return;
  }

  if (project.ownerId !== req.user!.userId) {
    res
      .status(403)
      .json({
        error: 'Forbidden',
        message: 'Only the owner can edit this project',
        statusCode: 403,
      });
    return;
  }

  const { title, language, coverUrl, voiceId, interstitialPreset } =
    req.body as UpdateProjectRequest;

  const data: Record<string, unknown> = {};
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      res
        .status(400)
        .json({ error: 'Validation failed', message: 'Title cannot be empty', statusCode: 400 });
      return;
    }
    data.title = title.trim();
  }
  if (language !== undefined) {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Language must be "pl" or "en"',
        statusCode: 400,
      });
      return;
    }
    data.language = language;
  }
  if (coverUrl !== undefined) data.coverUrl = coverUrl;
  if (voiceId !== undefined) data.voiceId = voiceId;
  if (interstitialPreset !== undefined) data.interstitialPreset = interstitialPreset;

  const voiceIdChanged = voiceId !== undefined && voiceId !== project.voiceId;

  if (voiceIdChanged) {
    // Drop generated audio for every scene so user can regenerate with new voice.
    const audioTracks = await prisma.audioTrack.findMany({
      where: { scene: { projectId: project.id } },
      select: { id: true, storagePath: true },
    });

    await Promise.allSettled(
      audioTracks.map(async (track) => {
        try {
          await deleteFile(track.storagePath);
        } catch (err) {
          console.warn('Failed to delete audio track storage on voice change', err);
        }
      }),
    );

    await prisma.$transaction([
      prisma.audioTrack.deleteMany({ where: { scene: { projectId: project.id } } }),
      prisma.scene.updateMany({
        where: {
          projectId: project.id,
          status: { in: ['audio_done', 'audio_error', 'audio_generating'] },
        },
        data: { status: 'ready_for_audio' },
      }),
      prisma.playlistItem.deleteMany({ where: { projectId: project.id } }),
    ]);
  }

  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data,
  });

  res.json(toResponse(updated));
});

projectsRouter.delete('/:id', async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });

  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
    return;
  }

  if (project.ownerId !== req.user!.userId) {
    res
      .status(403)
      .json({
        error: 'Forbidden',
        message: 'Only the owner can delete this project',
        statusCode: 403,
      });
    return;
  }

  await prisma.project.delete({ where: { id: req.params.id } });

  res.json({ message: 'Project deleted' });
});
