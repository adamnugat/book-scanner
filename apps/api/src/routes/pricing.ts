import { Router } from 'express';
import { PLAN_LIMITS } from '@book-scanner/shared';
import { requireAuth } from '../middleware/auth';
import { getUserPlan, getUserUsage } from '../lib/limits';
import { prisma } from '../lib/db';

export const pricingRouter = Router();

pricingRouter.get('/pricing', (_req, res) => {
  const plans = [
    {
      type: 'free',
      name: 'Free',
      price: 0,
      limits: PLAN_LIMITS.free,
      features: ['1 aktywny projekt', '30 stron/miesiąc', 'Podstawowe głosy', 'Podstawowe wstawki'],
    },
    {
      type: 'premium',
      name: 'Premium',
      price: 29,
      limits: PLAN_LIMITS.premium,
      features: ['10 aktywnych projektów', '300 stron/miesiąc', 'Szersza biblioteka głosów', 'Priorytetowe przetwarzanie'],
    },
    {
      type: 'max',
      name: 'Max',
      price: 79,
      limits: PLAN_LIMITS.max,
      features: ['50 aktywnych projektów', '1500 stron/miesiąc', 'Wszystkie głosy', 'Najwyższy priorytet'],
    },
  ];
  res.json(plans);
});

pricingRouter.get('/me/plan', requireAuth, async (req, res) => {
  const plan = await getUserPlan(req.user!.userId);
  res.json(plan);
});

pricingRouter.get('/me/usage', requireAuth, async (req, res) => {
  const plan = await getUserPlan(req.user!.userId);
  const usage = await getUserUsage(req.user!.userId);
  const projectCount = await prisma.project.count({ where: { ownerId: req.user!.userId } });

  res.json({
    plan: plan.planType,
    pagesUsed: usage.pagesUsed,
    pagesLimit: plan.pagesLimit,
    projectsUsed: projectCount,
    projectsLimit: plan.projectsLimit,
    charactersProcessed: usage.charactersProcessed,
    audioSecondsGenerated: usage.audioSecondsGenerated,
    storageUsedBytes: Number(usage.storageUsedBytes),
    periodMonth: usage.periodMonth,
  });
});
