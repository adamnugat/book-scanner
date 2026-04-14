export const SUPPORTED_LANGUAGES = ['pl', 'en'] as const;

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic'] as const;

export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export const PLAN_LIMITS = {
  free: {
    maxActiveProjects: 1,
    maxPagesPerMonth: 30,
  },
  premium: {
    maxActiveProjects: 10,
    maxPagesPerMonth: 300,
  },
  max: {
    maxActiveProjects: 50,
    maxPagesPerMonth: 1500,
  },
} as const;
