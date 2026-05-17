import { Router } from 'express';
import { prisma } from '../lib/db';
import { requireAuth } from '../middleware/auth';
import { requireProjectOwner } from '../middleware/project-owner';
import { requireRouteParam } from '../lib/route-params';
import { buildAudioTrackUrl } from './audio';

export const playlistRouter = Router({ mergeParams: true });

playlistRouter.use(requireAuth);

async function rebuildPlaylist(projectId: string): Promise<number> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Project not found');
  }

  const scenes = await prisma.scene.findMany({
    where: { projectId, status: 'audio_done' },
    orderBy: { orderIndex: 'asc' },
    include: { audioTrack: true },
  });

  if (scenes.length === 0) {
    return 0;
  }

  await prisma.playlistItem.deleteMany({ where: { projectId } });

  const interstitial = project.interstitialPreset?.startsWith('local:')
    ? null
    : project.interstitialPreset
      ? await prisma.interstitialPreset.findFirst({ where: { name: project.interstitialPreset } })
      : await prisma.interstitialPreset.findFirst();

  const items = [];
  let order = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    if (!scene.audioTrack) continue;

    items.push(
      await prisma.playlistItem.create({
        data: {
          projectId,
          type: 'scene',
          referenceId: scene.audioTrack.id,
          orderIndex: order++,
        },
      }),
    );

    if (interstitial && i < scenes.length - 1) {
      items.push(
        await prisma.playlistItem.create({
          data: {
            projectId,
            type: 'interstitial',
            referenceId: interstitial.id,
            orderIndex: order++,
          },
        }),
      );
    }
  }

  return items.length;
}

playlistRouter.post('/build-playlist', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');

  try {
    const itemCount = await rebuildPlaylist(projectId);

    if (itemCount === 0) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'No scenes with generated audio',
        statusCode: 400,
      });
      return;
    }

    res.json({ message: 'Playlist built', itemCount });
  } catch {
    res.status(404).json({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
  }
});

playlistRouter.get('/playlist', requireProjectOwner, async (req, res) => {
  const projectId = requireRouteParam(req, 'projectId');

  const audioTracksCount = await prisma.audioTrack.count({
    where: {
      scene: {
        projectId,
        status: 'audio_done',
      },
    },
  });

  const playlistSceneItemsCount = await prisma.playlistItem.count({
    where: { projectId, type: 'scene' },
  });

  if (audioTracksCount > playlistSceneItemsCount) {
    await rebuildPlaylist(projectId);
  }

  const items = await prisma.playlistItem.findMany({
    where: { projectId },
    orderBy: { orderIndex: 'asc' },
  });

  const result = [];

  for (const item of items) {
    if (item.type === 'scene') {
      const track = await prisma.audioTrack.findUnique({
        where: { id: item.referenceId },
        include: { scene: { select: { editedText: true, ocrText: true, orderIndex: true } } },
      });
      if (track) {
        result.push({
          id: item.id,
          projectId: item.projectId,
          type: item.type,
          referenceId: item.referenceId,
          orderIndex: item.orderIndex,
          audioUrl: buildAudioTrackUrl(req, projectId, track.id, req.user!.userId),
          durationMs: track.durationMs,
          sceneText: track.scene.editedText || track.scene.ocrText || '',
          sceneOrderIndex: track.scene.orderIndex,
        });
      }
    } else {
      const preset = await prisma.interstitialPreset.findUnique({
        where: { id: item.referenceId },
      });
      if (preset) {
        result.push({
          id: item.id,
          projectId: item.projectId,
          type: item.type,
          referenceId: item.referenceId,
          orderIndex: item.orderIndex,
          audioUrl: preset.audioUrl,
          durationMs: preset.durationMs,
        });
      }
    }
  }

  res.json(result);
});
