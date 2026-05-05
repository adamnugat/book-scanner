import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/db';
import { signAccessToken, signAssetToken } from '../src/lib/jwt';
import { listTtsVoices, synthesizeSpeech } from '../src/lib/tts';
import { downloadFileWithMetadata } from '../src/lib/storage';

vi.mock('../src/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscriptionPlan: {
      create: vi.fn(),
      findFirst: vi
        .fn()
        .mockResolvedValue({ planType: 'max', pagesLimit: 1500, projectsLimit: 50 }),
    },
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    projectShare: { findUnique: vi.fn() },
    pageImage: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    scene: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    textRegion: { create: vi.fn(), deleteMany: vi.fn() },
    voiceProfile: { findMany: vi.fn(), upsert: vi.fn() },
    audioTrack: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/lib/tts', () => ({
  synthesizeSpeech: vi.fn().mockResolvedValue({
    audioBuffer: Buffer.alloc(1024),
    durationMs: 5000,
  }),
  listTtsVoices: vi.fn(),
}));

vi.mock('../src/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('key'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  downloadFile: vi.fn(),
  downloadFileWithMetadata: vi.fn(),
  fileExists: vi.fn(),
}));

const db = vi.mocked(prisma);
const mockedListTtsVoices = vi.mocked(listTtsVoices);
const mockedSynthesizeSpeech = vi.mocked(synthesizeSpeech);
const mockedDownloadFileWithMetadata = vi.mocked(downloadFileWithMetadata);
const tokenA = signAccessToken({ userId: 'user-a', email: 'a@test.com' });
const now = new Date();

const projectA = {
  id: 'proj-1',
  ownerId: 'user-a',
  title: 'Test',
  coverUrl: null,
  language: 'pl',
  voiceId: 'voice-1',
  interstitialPreset: null,
  status: 'ready_for_tts',
  createdAt: now,
  updatedAt: now,
};

const projectNoVoice = { ...projectA, voiceId: null };

const scene1 = {
  id: 'scene-1',
  projectId: 'proj-1',
  pageImageId: 'img-1',
  ocrText: 'Tekst strony pierwszej',
  editedText: 'Poprawiony tekst',
  status: 'ready_for_audio',
  orderIndex: 0,
  createdAt: now,
  updatedAt: now,
};
const scene2 = {
  id: 'scene-2',
  projectId: 'proj-1',
  pageImageId: 'img-2',
  ocrText: 'Tekst strony drugiej',
  editedText: null,
  status: 'ready_for_audio',
  orderIndex: 1,
  createdAt: now,
  updatedAt: now,
};

const voicePl = {
  id: 'v-1',
  elevenlabsVoiceId: 'el-voice-1',
  name: 'Adam',
  language: 'pl',
  previewUrl: 'https://example.com/adam.mp3',
  isAvailableFree: true,
  isAvailablePremium: true,
  isAvailableMax: true,
};
const voiceEn = {
  id: 'v-2',
  elevenlabsVoiceId: 'el-voice-2',
  name: 'Rachel',
  language: 'en',
  previewUrl: 'https://example.com/rachel.mp3',
  isAvailableFree: false,
  isAvailablePremium: true,
  isAvailableMax: true,
};

describe('Voices', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-6.1: GET /voices?language=pl → Polish voices', async () => {
    db.voiceProfile.findMany.mockResolvedValue([voicePl]);

    const res = await request(app)
      .get('/voices?language=pl')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Adam');
    expect(res.body[0].language).toBe('pl');
    expect(res.body[0].previewUrl).toBeDefined();
    expect(mockedListTtsVoices).not.toHaveBeenCalled();
  });

  it('T-6.2: GET /voices?language=en → English voices', async () => {
    db.voiceProfile.findMany.mockResolvedValue([voiceEn]);

    const res = await request(app)
      .get('/voices?language=en')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].language).toBe('en');
  });

  it('T-6.3: voice has preview URL for playback', async () => {
    db.voiceProfile.findMany.mockResolvedValue([voicePl, voiceEn]);

    const res = await request(app).get('/voices').set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    for (const v of res.body) {
      expect(v.previewUrl).toBeTruthy();
    }
  });

  it('syncs ElevenLabs voices when the local filtered catalog is empty', async () => {
    const syncedVoice = {
      id: 'v-eleven',
      elevenlabsVoiceId: 'el-voice-11',
      name: 'Antoni',
      language: 'pl',
      previewUrl: 'https://example.com/antoni.mp3',
      isAvailableFree: true,
      isAvailablePremium: true,
      isAvailableMax: true,
    };
    db.voiceProfile.findMany.mockResolvedValue([]);
    db.voiceProfile.upsert.mockResolvedValue(syncedVoice);
    mockedListTtsVoices.mockResolvedValue([
      {
        elevenlabsVoiceId: 'el-voice-11',
        name: 'Antoni',
        language: 'pl',
        previewUrl: 'https://example.com/antoni.mp3',
      },
    ]);

    const res = await request(app)
      .get('/voices?language=pl')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(db.voiceProfile.upsert).toHaveBeenCalledWith({
      where: { elevenlabsVoiceId: 'el-voice-11' },
      create: {
        elevenlabsVoiceId: 'el-voice-11',
        name: 'Antoni',
        language: 'pl',
        previewUrl: 'https://example.com/antoni.mp3',
        isAvailableFree: true,
        isAvailablePremium: true,
        isAvailableMax: true,
      },
      update: {
        name: 'Antoni',
        language: 'pl',
        previewUrl: 'https://example.com/antoni.mp3',
      },
    });
    expect(res.body).toEqual([
      {
        id: 'v-eleven',
        elevenlabsVoiceId: 'el-voice-11',
        name: 'Antoni',
        language: 'pl',
        previewUrl: 'https://example.com/antoni.mp3',
      },
    ]);
  });

  it('returns a standard error when ElevenLabs voices cannot be loaded', async () => {
    db.voiceProfile.findMany.mockResolvedValue([]);
    mockedListTtsVoices.mockRejectedValue(new Error('ELEVENLABS_API_KEY not configured'));

    const res = await request(app)
      .get('/voices?language=pl')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: 'Service Unavailable',
      message: 'Unable to load TTS voices. Check ElevenLabs configuration.',
      statusCode: 503,
    });
  });

  it('preserves language and plan filters for local voice lookup', async () => {
    db.subscriptionPlan.findFirst.mockResolvedValueOnce({
      planType: 'free',
      pagesLimit: 100,
      projectsLimit: 3,
    });
    db.voiceProfile.findMany.mockResolvedValue([voicePl]);

    const res = await request(app)
      .get('/voices?language=pl')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(db.voiceProfile.findMany).toHaveBeenCalledWith({
      where: { OR: [{ language: 'pl' }, { language: 'multi' }], isAvailableFree: true },
      orderBy: { name: 'asc' },
    });
  });
});

describe('Audio generation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('T-6.4: POST generate-audio → 202 + scenes with audio_generating', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.scene.findMany.mockResolvedValueOnce([scene1, scene2]).mockResolvedValueOnce([
      { ...scene1, status: 'audio_generating' },
      { ...scene2, status: 'audio_generating' },
    ]);
    db.scene.update.mockResolvedValue({ ...scene1, status: 'audio_generating' });
    db.audioTrack.findUnique.mockResolvedValue(null);
    db.audioTrack.create.mockResolvedValue({
      id: 'at-1',
      sceneId: 'scene-1',
      storagePath: 'audio/1.mp3',
      durationMs: 5000,
      fileSize: 1024,
      createdAt: now,
    });
    db.scene.count.mockResolvedValue(0);
    db.project.update.mockResolvedValue(projectA);

    const res = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(202);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.map((scene: { status: string }) => scene.status)).toEqual([
      'audio_generating',
      'audio_generating',
    ]);
  });

  it('rejects without voice → 400', async () => {
    db.project.findUnique.mockResolvedValue(projectNoVoice);

    const res = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('voice');
  });

  it('rejects when no scenes ready → 400', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.scene.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
  });

  it('T-6.8: re-generation replaces existing tracks', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.scene.findMany
      .mockResolvedValueOnce([{ ...scene1, status: 'ready_for_audio' }])
      .mockResolvedValueOnce([{ ...scene1, status: 'audio_generating' }]);
    db.scene.update.mockResolvedValue({ ...scene1, status: 'audio_generating' });
    db.audioTrack.findUnique.mockResolvedValue({
      id: 'old-at',
      sceneId: 'scene-1',
      storagePath: 'old.mp3',
      durationMs: 3000,
      fileSize: 512,
      createdAt: now,
    });
    db.audioTrack.delete.mockResolvedValue({} as never);
    db.audioTrack.create.mockResolvedValue({
      id: 'new-at',
      sceneId: 'scene-1',
      storagePath: 'new.mp3',
      durationMs: 5000,
      fileSize: 1024,
      createdAt: now,
    });
    db.scene.count.mockResolvedValue(0);
    db.project.update.mockResolvedValue(projectA);

    const res = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(202);
    expect(db.audioTrack.delete).toHaveBeenCalledWith({ where: { id: 'old-at' } });
  });

  it('marks one scene as audio_error and continues the batch when TTS fails', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.scene.findMany.mockResolvedValueOnce([scene1, scene2]).mockResolvedValueOnce([
      { ...scene1, status: 'audio_generating' },
      { ...scene2, status: 'audio_generating' },
    ]);
    db.scene.update.mockResolvedValue({ ...scene1, status: 'audio_generating' });
    db.audioTrack.findUnique.mockResolvedValue(null);
    db.audioTrack.create.mockResolvedValue({
      id: 'at-1',
      sceneId: 'scene-1',
      storagePath: 'audio/1.mp3',
      durationMs: 5000,
      fileSize: 1024,
      createdAt: now,
    });
    db.scene.count.mockResolvedValue(0);
    db.project.update.mockResolvedValue(projectA);
    mockedSynthesizeSpeech
      .mockResolvedValueOnce({ audioBuffer: Buffer.alloc(1024), durationMs: 5000 })
      .mockRejectedValueOnce(new Error('ElevenLabs rate limit'));

    const res = await request(app)
      .post('/projects/proj-1/generate-audio')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(202);
    await vi.waitFor(() => {
      expect(db.scene.update).toHaveBeenCalledWith({
        where: { id: 'scene-2' },
        data: { status: 'audio_error' },
      });
    });
    expect(db.audioTrack.create).toHaveBeenCalledTimes(1);
    expect(db.project.update).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      data: { status: 'completed' },
    });
  });
});

describe('Audio tracks', () => {
  it('GET audio-tracks returns tracks for project', async () => {
    db.project.findUnique.mockResolvedValue(projectA);
    db.audioTrack.findMany.mockResolvedValue([
      {
        id: 'at-1',
        sceneId: 'scene-1',
        storagePath: 'audio/1.mp3',
        durationMs: 5000,
        fileSize: 1024,
        createdAt: now,
        scene: { orderIndex: 0 },
      },
    ]);

    const res = await request(app)
      .get('/projects/proj-1/audio-tracks')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].durationMs).toBe(5000);
    expect(res.body[0].audioUrl).toMatch(
      /\/projects\/proj-1\/audio-tracks\/at-1\/file\?token=[\w-]+\.[\w-]+\.[\w-]+/,
    );
  });
});

describe('Audio track file streaming', () => {
  beforeEach(() => vi.clearAllMocks());

  const trackRecord = {
    id: 'at-1',
    sceneId: 'scene-1',
    storagePath: 'projects/proj-1/audio/at-1.mp3',
    durationMs: 5000,
    fileSize: 1024,
    createdAt: now,
    scene: { projectId: 'proj-1' },
  };

  const buildToken = (overrides: Partial<Parameters<typeof signAssetToken>[0]> = {}) =>
    signAssetToken({
      userId: 'user-a',
      projectId: 'proj-1',
      audioTrackId: 'at-1',
      variant: 'audio',
      ...overrides,
    });

  it('streams the audio file when the asset token is valid for the owner', async () => {
    db.audioTrack.findUnique.mockResolvedValue(trackRecord as never);
    db.project.findUnique.mockResolvedValue(projectA);
    mockedDownloadFileWithMetadata.mockResolvedValue({
      body: Buffer.from('fake-mp3-bytes'),
      contentType: 'audio/mpeg',
    });

    const token = buildToken();
    const res = await request(app).get(`/projects/proj-1/audio-tracks/at-1/file?token=${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^audio\//);
    expect(res.body.toString()).toBe('fake-mp3-bytes');
    expect(mockedDownloadFileWithMetadata).toHaveBeenCalledWith('projects/proj-1/audio/at-1.mp3');
  });

  it('rejects requests without a token with 401', async () => {
    const res = await request(app).get('/projects/proj-1/audio-tracks/at-1/file');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: 'Unauthorized', statusCode: 401 });
  });

  it('rejects an invalid asset token with 401', async () => {
    const res = await request(app).get(
      '/projects/proj-1/audio-tracks/at-1/file?token=not-a-real-token',
    );
    expect(res.status).toBe(401);
  });

  it('rejects a token bound to a different project with 403', async () => {
    const token = buildToken({ projectId: 'proj-other' });
    const res = await request(app).get(`/projects/proj-1/audio-tracks/at-1/file?token=${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: 'Forbidden', statusCode: 403 });
  });

  it('rejects a token bound to a different audio track with 403', async () => {
    const token = buildToken({ audioTrackId: 'at-other' });
    const res = await request(app).get(`/projects/proj-1/audio-tracks/at-1/file?token=${token}`);
    expect(res.status).toBe(403);
  });

  it('rejects a token with a non-audio variant with 403', async () => {
    const token = signAssetToken({
      userId: 'user-a',
      projectId: 'proj-1',
      imageId: 'img-1',
      variant: 'file',
    });
    const res = await request(app).get(`/projects/proj-1/audio-tracks/at-1/file?token=${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 when the track does not exist', async () => {
    db.audioTrack.findUnique.mockResolvedValue(null as never);

    const token = buildToken();
    const res = await request(app).get(`/projects/proj-1/audio-tracks/at-1/file?token=${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 when the track belongs to another project', async () => {
    db.audioTrack.findUnique.mockResolvedValue({
      ...trackRecord,
      scene: { projectId: 'proj-other' },
    } as never);

    const token = buildToken();
    const res = await request(app).get(`/projects/proj-1/audio-tracks/at-1/file?token=${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 when the project owner does not match the token user', async () => {
    db.audioTrack.findUnique.mockResolvedValue(trackRecord as never);
    db.project.findUnique.mockResolvedValue({ ...projectA, ownerId: 'someone-else' });

    const token = buildToken();
    const res = await request(app).get(`/projects/proj-1/audio-tracks/at-1/file?token=${token}`);
    expect(res.status).toBe(403);
  });
});
