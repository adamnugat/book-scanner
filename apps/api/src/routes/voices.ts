import { Router } from 'express';
import { prisma } from '../lib/db';
import { requireAuth } from '../middleware/auth';
import { getUserPlan } from '../lib/limits';
import { listTtsVoices } from '../lib/tts';

export const voicesRouter = Router();

voicesRouter.use(requireAuth);

voicesRouter.get('/', async (req, res) => {
  const language = req.query.language as string | undefined;
  const plan = await getUserPlan(req.user!.userId);
  const where = buildVoiceWhere(language, plan.planType);

  const voices = await prisma.voiceProfile.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  if (voices.length > 0) {
    res.json(voices.map(toVoiceResponse));
    return;
  }

  try {
    const providerVoices = await listTtsVoices();
    const syncedVoices = await Promise.all(
      providerVoices.map((voice) =>
        prisma.voiceProfile.upsert({
          where: { elevenlabsVoiceId: voice.elevenlabsVoiceId },
          create: {
            elevenlabsVoiceId: voice.elevenlabsVoiceId,
            name: voice.name,
            language: voice.language,
            previewUrl: voice.previewUrl,
            isAvailableFree: true,
            isAvailablePremium: true,
            isAvailableMax: true,
          },
          update: {
            name: voice.name,
            language: voice.language,
            previewUrl: voice.previewUrl,
          },
        }),
      ),
    );

    res.json(
      syncedVoices
        .filter((voice) => matchesLanguage(voice.language, language))
        .filter((voice) => matchesPlan(voice, plan.planType))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(toVoiceResponse),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown TTS voices error';
    console.error(`TTS voices error: ${message}`);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Unable to load TTS voices. Check ElevenLabs configuration.',
      statusCode: 503,
    });
  }
});

function buildVoiceWhere(language: string | undefined, planType: string): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (language) {
    where.OR = [{ language }, { language: 'multi' }];
  }

  if (planType === 'free') {
    where.isAvailableFree = true;
  } else if (planType === 'premium') {
    where.isAvailablePremium = true;
  }

  return where;
}

function matchesLanguage(voiceLanguage: string, language: string | undefined): boolean {
  return !language || voiceLanguage === language || voiceLanguage === 'multi';
}

function matchesPlan(
  voice: { isAvailableFree: boolean; isAvailablePremium: boolean },
  planType: string,
): boolean {
  if (planType === 'free') {
    return voice.isAvailableFree;
  }
  if (planType === 'premium') {
    return voice.isAvailablePremium;
  }
  return true;
}

function toVoiceResponse(voice: {
  id: string;
  elevenlabsVoiceId: string;
  name: string;
  language: string;
  previewUrl: string | null;
}) {
  return {
    id: voice.id,
    elevenlabsVoiceId: voice.elevenlabsVoiceId,
    name: voice.name,
    language: voice.language,
    previewUrl: voice.previewUrl,
  };
}
