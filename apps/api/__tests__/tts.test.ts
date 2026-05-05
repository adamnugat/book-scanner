import { afterEach, describe, expect, it, vi } from 'vitest';
import { listTtsVoices } from '../src/lib/tts';

const originalEnv = { ...process.env };

describe('listTtsVoices', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it('fetches and maps ElevenLabs voices when configured', async () => {
    process.env.TTS_PROVIDER = 'elevenlabs';
    process.env.ELEVENLABS_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        voices: [
          {
            voice_id: 'voice-1',
            name: 'Antoni',
            preview_url: 'https://example.com/antoni.mp3',
            labels: { language: 'pl' },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const voices = await listTtsVoices();

    expect(fetchMock).toHaveBeenCalledWith('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': 'test-key' },
    });
    expect(voices).toEqual([
      {
        elevenlabsVoiceId: 'voice-1',
        name: 'Antoni',
        language: 'pl',
        previewUrl: 'https://example.com/antoni.mp3',
      },
    ]);
  });

  it('fails clearly when ElevenLabs is selected without an API key', async () => {
    process.env.TTS_PROVIDER = 'elevenlabs';
    delete process.env.ELEVENLABS_API_KEY;

    await expect(listTtsVoices()).rejects.toThrow('ELEVENLABS_API_KEY not configured');
  });
});
