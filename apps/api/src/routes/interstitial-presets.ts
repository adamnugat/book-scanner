import { Router } from 'express';
import { prisma } from '../lib/db';
import { requireAuth } from '../middleware/auth';

export const interstitialPresetsRouter = Router();

interstitialPresetsRouter.use(requireAuth);

interstitialPresetsRouter.get('/', async (_req, res) => {
  const presets = await prisma.interstitialPreset.findMany({
    orderBy: [{ durationMs: 'asc' }, { name: 'asc' }],
  });

  res.json(
    presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      audioUrl: preset.audioUrl,
      durationMs: preset.durationMs,
    })),
  );
});
