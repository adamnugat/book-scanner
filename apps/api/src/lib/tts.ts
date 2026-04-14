export interface TtsResult {
  audioBuffer: Buffer;
  durationMs: number;
}

export async function synthesizeSpeech(
  text: string,
  voiceId: string,
): Promise<TtsResult> {
  if (process.env.TTS_PROVIDER === 'elevenlabs') {
    return synthesizeWithElevenLabs(text, voiceId);
  }
  return synthesizeWithMock(text);
}

async function synthesizeWithElevenLabs(
  text: string,
  voiceId: string,
): Promise<TtsResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured');

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
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
    },
  );

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
