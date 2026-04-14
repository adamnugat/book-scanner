import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const interstitials = [
    { name: 'Soft chime', audioUrl: 'presets/soft-chime.mp3', durationMs: 2000 },
    { name: 'Page turn', audioUrl: 'presets/page-turn.mp3', durationMs: 1500 },
    { name: 'Silence (1s)', audioUrl: 'presets/silence-1s.mp3', durationMs: 1000 },
    { name: 'Silence (2s)', audioUrl: 'presets/silence-2s.mp3', durationMs: 2000 },
  ];

  for (const preset of interstitials) {
    await prisma.interstitialPreset.upsert({
      where: { id: preset.name },
      update: preset,
      create: preset,
    });
  }

  console.log('Seed completed: interstitial presets created');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
