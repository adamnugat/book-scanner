import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recognizeText } from '../src/lib/ocr';
import { downloadFile } from '../src/lib/storage';

const visionMocks = vi.hoisted(() => ({
  batchAnnotateImages: vi.fn(),
  imageAnnotatorClient: vi.fn(),
}));

vi.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: visionMocks.imageAnnotatorClient,
}));

vi.mock('../src/lib/storage', () => ({
  downloadFile: vi.fn(),
}));

const storageDownloadFile = vi.mocked(downloadFile);

function setGoogleCredentials() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/google-vision-service-account.json';
}

describe('OCR provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OCR_PROVIDER;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
    delete process.env.GOOGLE_CLOUD_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    delete process.env.GOOGLE_CLOUD_PRIVATE_KEY;

    storageDownloadFile.mockResolvedValue(Buffer.from('image-bytes'));
    visionMocks.imageAnnotatorClient.mockImplementation(() => ({
      batchAnnotateImages: visionMocks.batchAnnotateImages,
    }));
  });

  it('keeps mock OCR as the default provider', async () => {
    const result = await recognizeText('pages/page-1.jpg', 'pl');

    expect(result.text).toContain('To jest przykładowy tekst rozpoznany przez OCR');
    expect(visionMocks.imageAnnotatorClient).not.toHaveBeenCalled();
    expect(storageDownloadFile).not.toHaveBeenCalled();
  });

  it('uses Google Cloud Vision when the google provider is selected', async () => {
    process.env.OCR_PROVIDER = 'google';
    setGoogleCredentials();
    visionMocks.batchAnnotateImages.mockResolvedValue([
      {
        responses: [
          {
            fullTextAnnotation: { text: 'Rozpoznany tekst strony\n' },
          },
        ],
      },
    ]);

    const result = await recognizeText('pages/page-1.jpg', 'pl');

    expect(result).toEqual({ text: 'Rozpoznany tekst strony' });
    expect(visionMocks.imageAnnotatorClient).toHaveBeenCalledWith({});
    expect(visionMocks.batchAnnotateImages).toHaveBeenCalledWith({
      requests: [
        {
          image: { content: Buffer.from('image-bytes') },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          imageContext: { languageHints: ['pl', 'en'] },
        },
      ],
    });
  });

  it('fails clearly when Google OCR is selected without credentials', async () => {
    process.env.OCR_PROVIDER = 'google';

    await expect(recognizeText('pages/page-1.jpg', 'pl')).rejects.toThrow(
      'Google Cloud Vision credentials are not configured',
    );
    expect(storageDownloadFile).not.toHaveBeenCalled();
  });

  it('supports inline service account fields for deployment environments', async () => {
    process.env.OCR_PROVIDER = 'google';
    process.env.GOOGLE_CLOUD_PROJECT_ID = 'book-scanner';
    process.env.GOOGLE_CLOUD_CLIENT_EMAIL = 'vision@test.iam.gserviceaccount.com';
    process.env.GOOGLE_CLOUD_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n';
    visionMocks.batchAnnotateImages.mockResolvedValue([
      {
        responses: [
          {
            fullTextAnnotation: { text: 'Inline credentials text' },
          },
        ],
      },
    ]);

    await recognizeText('pages/page-1.jpg', 'en');

    expect(visionMocks.imageAnnotatorClient).toHaveBeenCalledWith({
      projectId: 'book-scanner',
      credentials: {
        client_email: 'vision@test.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
      },
    });
  });

  it('returns an empty result when Google Vision detects no text', async () => {
    process.env.OCR_PROVIDER = 'google';
    setGoogleCredentials();
    visionMocks.batchAnnotateImages.mockResolvedValue([{ responses: [{}] }]);

    const result = await recognizeText('pages/page-1.jpg', 'pl');

    expect(result).toEqual({ text: '' });
  });

  it('extracts normalized regions in submitted order', async () => {
    process.env.OCR_PROVIDER = 'google';
    setGoogleCredentials();
    visionMocks.batchAnnotateImages.mockResolvedValue([
      {
        responses: [
          {
            fullTextAnnotation: {
              text: 'Full page text',
              pages: [
                {
                  width: 1000,
                  height: 1000,
                  blocks: [
                    {
                      boundingBox: {
                        vertices: [
                          { x: 610, y: 110 },
                          { x: 760, y: 110 },
                          { x: 760, y: 260 },
                          { x: 610, y: 260 },
                        ],
                      },
                      paragraphs: [
                        {
                          words: [
                            { symbols: [{ text: 'Second' }] },
                          ],
                        },
                      ],
                    },
                    {
                      boundingBox: {
                        vertices: [
                          { x: 110, y: 110 },
                          { x: 260, y: 110 },
                          { x: 260, y: 260 },
                          { x: 110, y: 260 },
                        ],
                      },
                      paragraphs: [
                        {
                          words: [
                            { symbols: [{ text: 'First' }] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ]);

    const result = await recognizeText('pages/page-1.jpg', 'pl', [
      { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      { x: 0.6, y: 0.1, width: 0.2, height: 0.2 },
    ]);

    expect(result).toEqual({ text: 'First\nSecond' });
  });

  it('propagates sanitized Google Vision errors', async () => {
    process.env.OCR_PROVIDER = 'google';
    setGoogleCredentials();
    visionMocks.batchAnnotateImages.mockResolvedValue([
      {
        responses: [
          {
            error: { message: 'permission denied' },
          },
        ],
      },
    ]);

    await expect(recognizeText('pages/page-1.jpg', 'pl')).rejects.toThrow(
      'Google Cloud Vision OCR failed: permission denied',
    );
  });
});
