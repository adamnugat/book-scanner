import { PLAN_LIMITS } from '@book-scanner/shared';
import type { PlanType } from '@book-scanner/shared';
import { prisma } from './db';

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function getUserPlan(userId: string): Promise<{ planType: PlanType; pagesLimit: number; projectsLimit: number }> {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { userId },
    orderBy: { startedAt: 'desc' },
  });
  const planType = (plan?.planType || 'free') as PlanType;
  const limits = PLAN_LIMITS[planType];
  return {
    planType,
    pagesLimit: plan?.pagesLimit ?? limits.maxPagesPerMonth,
    projectsLimit: plan?.projectsLimit ?? limits.maxActiveProjects,
  };
}

export async function getUserUsage(userId: string) {
  const period = currentPeriod();
  let usage = await prisma.usageTracking.findUnique({
    where: { userId_periodMonth: { userId, periodMonth: period } },
  });
  if (!usage) {
    usage = await prisma.usageTracking.create({
      data: { userId, periodMonth: period },
    });
  }
  return usage;
}

export async function checkProjectLimit(userId: string): Promise<string | null> {
  const plan = await getUserPlan(userId);
  const projectCount = await prisma.project.count({ where: { ownerId: userId } });
  if (projectCount >= plan.projectsLimit) {
    return `Project limit reached (${plan.projectsLimit} on ${plan.planType} plan). Upgrade to create more projects.`;
  }
  return null;
}

export async function checkPageLimit(userId: string, newPages: number): Promise<string | null> {
  const plan = await getUserPlan(userId);
  const usage = await getUserUsage(userId);
  if (usage.pagesUsed + newPages > plan.pagesLimit) {
    return `Page limit reached (${plan.pagesLimit}/month on ${plan.planType} plan). Used: ${usage.pagesUsed}. Upgrade for more pages.`;
  }
  return null;
}

export async function incrementPageUsage(userId: string, pages: number): Promise<void> {
  const period = currentPeriod();
  await prisma.usageTracking.upsert({
    where: { userId_periodMonth: { userId, periodMonth: period } },
    create: { userId, periodMonth: period, pagesUsed: pages },
    update: { pagesUsed: { increment: pages } },
  });
}
