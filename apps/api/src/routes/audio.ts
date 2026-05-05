import { Router, type Request } from 'express';
import { URLSearchParams } from 'url';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/db';
import { synthesizeSpeech } from '../lib/tts';
import { uploadFile, downloadFileWithMetadata } from '../lib/storage';
import { requireAuth } from '../middleware/auth';
import { requireProjectOwner } from '../middleware/project-owner';
import { requireRouteParam } from '../lib/route-params';
import { signAssetToken, verifyAssetToken } from '../lib/jwt';

export const audioRouter = Router({ mergeParams: true });

export function buildAudioTrackUrl(
  req: Request,
  projectId: string,
  trackId: string,
  userId: string,
): string {
  const host = req.get('host');
  const baseUrl = host ? `${req.protocol}://${host}` : '';
  const token = signAssetToken({
    userId,
    projectId,
    audioTrackId: trackId,
    variant: 'audio',
  });
  const path = `/projects/${projectId}/audio-tracks/${trackId}/file?${new URLSearchParams({ token }).toString()}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

audioRouter.get('/audio-tracks/:trackId/file', async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');
  const trackId = requireRouteParam(req, 'trackId');
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
    payload.variant !== 'audio' ||
    payload.projectId !== projectId ||
    payload.audioTrackId !== trackId
  ) {
    res.status(403).json({ error: 'Forbidden', message: 'Asset token mismatch', statusCode: 403 });
    return;
  }

  const track = await prisma.audioTrack.findUnique({
    where: { id: trackId },
    include: { scene: { select: { projectId: true } } },
  });
  if (!track || track.scene.projectId !== projectId) {
    res.status(404).json({ error: 'Not Found', message: 'Audio track not found', statusCode: 404 });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== payload.userId) {
    res.status(403).json({ error: 'Forbidden', message: 'Access denied', statusCode: 403 });
    return;
  }

  const file = await downloadFileWithMetadata(track.storagePath);
  res.setHeader('Content-Type', file.contentType || 'audio/mpeg');
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.send(file.body);
});

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
      audioUrl: buildAudioTrackUrl(req, projectId, t.id, req.user!.userId),
      durationMs: t.durationMs,
      fileSize: t.fileSize,
      createdAt: t.createdAt.toISOString(),
    })),
  );
});
