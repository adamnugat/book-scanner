export interface TtsResult {
  audioBuffer: Buffer;
  durationMs: number;
}

export interface TtsVoice {
  elevenlabsVoiceId: string;
  name: string;
  language: string;
  previewUrl: string | null;
}

export async function synthesizeSpeech(text: string, voiceId: string): Promise<TtsResult> {
  if (process.env.TTS_PROVIDER === 'elevenlabs') {
    return synthesizeWithElevenLabs(text, voiceId);
  }
  return synthesizeWithMock(text);
}

export async function listTtsVoices(): Promise<TtsVoice[]> {
  if (process.env.TTS_PROVIDER !== 'elevenlabs') {
    return [];
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured');

  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs voices API error (${response.status}): ${err}`);
  }

  const payload = (await response.json()) as { voices?: ElevenLabsVoice[] };
  if (!Array.isArray(payload.voices)) {
    throw new Error('Invalid ElevenLabs voices response');
  }

  return payload.voices
    .filter((voice) => voice.voice_id && voice.name)
    .map((voice) => ({
      elevenlabsVoiceId: voice.voice_id,
      name: voice.name,
      language: normalizeVoiceLanguage(voice.labels?.language),
      previewUrl: voice.preview_url ?? null,
    }));
}

async function synthesizeWithElevenLabs(text: string, voiceId: string): Promise<TtsResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured');

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  const durationMs = estimateDuration(text);

  return { audioBuffer, durationMs };
}

async function synthesizeWithMock(text: string): Promise<TtsResult> {
  await new Promise((r) => setTimeout(r, 50));

  const header = Buffer.from('RIFF', 'ascii');
  const fakeAudio = Buffer.alloc(1024);
  header.copy(fakeAudio);

  return {
    audioBuffer: fakeAudio,
    durationMs: estimateDuration(text),
  };
}

function estimateDuration(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1000, Math.round((words / 150) * 60 * 1000));
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string | null;
  labels?: {
    language?: unknown;
  };
}

function normalizeVoiceLanguage(language: unknown): string {
  if (typeof language !== 'string') {
    return 'multi';
  }

  const normalized = language.trim().toLowerCase();
  if (normalized === 'pl' || normalized === 'polish' || normalized === 'polski') {
    return 'pl';
  }
  if (normalized === 'en' || normalized === 'english') {
    return 'en';
  }

  return normalized || 'multi';
}
