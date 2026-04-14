import { Router } from 'express';
import { prisma } from '../lib/db';
import { requireAuth } from '../middleware/auth';
import { getUserPlan } from '../lib/limits';

export const voicesRouter = Router();

voicesRouter.use(requireAuth);

voicesRouter.get('/', async (req, res) => {
  const language = req.query.language as string | undefined;
  const plan = await getUserPlan(req.user!.userId);

  const where: Record<string, unknown> = {};
  if (language) {
    where.language = language;
  }

  if (plan.planType === 'free') {
    where.isAvailableFree = true;
  } else if (plan.planType === 'premium') {
    where.isAvailablePremium = true;
  }

  const voices = await prisma.voiceProfile.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  res.json(
    voices.map((v) => ({
      id: v.id,
      elevenlabsVoiceId: v.elevenlabsVoiceId,
      name: v.name,
      language: v.language,
      previewUrl: v.previewUrl,
    })),
  );
});
