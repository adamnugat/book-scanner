import { Router } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/db';
import { synthesizeSpeech } from '../lib/tts';
import { uploadFile } from '../lib/storage';
import { requireAuth } from '../middleware/auth';
import { requireProjectOwner } from '../middleware/project-owner';
import { requireRouteParam } from '../lib/route-params';

export const audioRouter = Router({ mergeParams: true });

audioRouter.use(requireAuth);

audioRouter.post('/generate-audio', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
    return;
  }

  if (!project.voiceId) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Select a voice before generating audio',
      statusCode: 400,
    });
    return;
  }

  const scenes = await prisma.scene.findMany({
    where: { projectId, status: 'ready_for_audio' },
    orderBy: { orderIndex: 'asc' },
  });

  if (scenes.length === 0) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'No scenes ready for audio generation',
      statusCode: 400,
    });
    return;
  }

  for (const scene of scenes) {
    await prisma.scene.update({
      where: { id: scene.id },
      data: { status: 'audio_generating' },
    });
  }

  generateAudioInBackground(projectId, project.voiceId, scenes);

  const allScenes = await prisma.scene.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
  });

  res.status(202).json(
    allScenes.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      pageImageId: s.pageImageId,
      ocrText: s.ocrText,
      editedText: s.editedText,
      status: s.status,
      orderIndex: s.orderIndex,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  );
});

async function generateAudioInBackground(
  projectId: string,
  voiceId: string,
  scenes: { id: string; editedText: string | null; ocrText: string | null }[],
) {
  for (const scene of scenes) {
    const text = scene.editedText || scene.ocrText || '';

    if (!text.trim()) {
      await prisma.scene.update({
        where: { id: scene.id },
        data: { status: 'audio_error' },
      });
      continue;
    }

    try {
      const result = await synthesizeSpeech(text, voiceId);

      const fileId = randomUUID();
      const storagePath = `projects/${projectId}/audio/${fileId}.mp3`;
      await uploadFile(storagePath, result.audioBuffer, 'audio/mpeg');

      const existing = await prisma.audioTrack.findUnique({ where: { sceneId: scene.id } });
      if (existing) {
        await prisma.audioTrack.delete({ where: { id: existing.id } });
      }

      await prisma.audioTrack.create({
        data: {
          sceneId: scene.id,
          storagePath,
          durationMs: result.durationMs,
          fileSize: result.audioBuffer.length,
        },
      });

      await prisma.scene.update({
        where: { id: scene.id },
        data: { status: 'audio_done' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown TTS error';
      console.error(`TTS error for scene ${scene.id}: ${message}`);
      await prisma.scene.update({
        where: { id: scene.id },
        data: { status: 'audio_error' },
      });
    }
  }

  const remaining = await prisma.scene.count({
    where: { projectId, status: 'audio_generating' },
  });

  if (remaining === 0) {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'completed' },
    });
  }
}

audioRouter.get('/audio-tracks', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');
  const tracks = await prisma.audioTrack.findMany({
    where: { scene: { projectId } },
    include: { scene: { select: { orderIndex: true } } },
    orderBy: { scene: { orderIndex: 'asc' } },
  });

  res.json(
    tracks.map((t) => ({
      id: t.id,
      sceneId: t.sceneId,
      storagePath: t.storagePath,
      durationMs: t.durationMs,
      fileSize: t.fileSize,
      createdAt: t.createdAt.toISOString(),
    })),
  );
});
