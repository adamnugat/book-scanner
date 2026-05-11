import { ImageAnnotatorClient, type protos } from '@google-cloud/vision';
import { downloadFile } from './storage';

export interface OcrResult {
  text: string;
  confidence?: number;
}

type TextRegion = { x: number; y: number; width: number; height: number };
export interface OcrBatchInput {
  storagePath: string;
  regions?: TextRegion[];
}

type GoogleVisionClientOptions = NonNullable<ConstructorParameters<typeof ImageAnnotatorClient>[0]>;
type GoogleVisionResponse = protos.google.cloud.vision.v1.IAnnotateImageResponse;
type GoogleTextAnnotation = protos.google.cloud.vision.v1.ITextAnnotation;
const GOOGLE_VISION_BATCH_SIZE = 5;
const GOOGLE_VISION_SAFE_PAYLOAD_BYTES = 7 * 1024 * 1024;

export async function recognizeText(
  storagePath: string,
  language: string,
  regions?: TextRegion[],
): Promise<OcrResult> {
  const [result] = await recognizeTextBatch([{ storagePath, regions }], language);
  return result || { text: '' };
}

export async function recognizeTextBatch(
  inputs: OcrBatchInput[],
  language: string,
): Promise<OcrResult[]> {
  if (inputs.length === 0) {
    return [];
  }

  if (process.env.OCR_PROVIDER === 'google') {
    return recognizeBatchWithGoogle(inputs, language);
  }

  const results: OcrResult[] = [];
  for (const input of inputs) {
    results.push(await recognizeWithMock(input.storagePath, language, input.regions));
  }
  return results;
}

async function recognizeBatchWithGoogle(
  inputs: OcrBatchInput[],
  language: string,
): Promise<OcrResult[]> {
  const client = new ImageAnnotatorClient(getGoogleVisionClientOptions());
  const languageHints = language === 'pl' ? ['pl', 'en'] : ['en', 'pl'];
  const results: OcrResult[] = [];
  const googleInputs = await Promise.all(
    inputs.map(async (input) => ({
      input,
      imageBuffer: await downloadFile(input.storagePath),
    })),
  );

  for (const chunk of chunkGoogleInputs(googleInputs)) {
    const imageBuffers = chunk.map((item) => item.imageBuffer);
    const annotations = await annotateImagesWithGoogle(client, imageBuffers, languageHints);

    for (let index = 0; index < chunk.length; index++) {
      results.push(toOcrResult(annotations[index] || {}, chunk[index].input.regions));
    }
  }

  return results;
}

function toOcrResult(annotations: GoogleVisionResponse, regions?: TextRegion[]): OcrResult {
  if (annotations.error?.message) {
    throw new Error(`Google Cloud Vision OCR failed: ${sanitizeErrorMessage(annotations.error.message)}`);
  }

  const fullText =
    annotations.fullTextAnnotation?.text ||
    annotations.textAnnotations?.[0]?.description ||
    '';

  if (regions && regions.length > 0 && annotations.fullTextAnnotation) {
    const croppedText = extractRegionText(annotations.fullTextAnnotation, regions);
    return { text: (croppedText || fullText).trim() };
  }

  return { text: fullText.trim() };
}

async function annotateImagesWithGoogle(
  client: ImageAnnotatorClient,
  imageBuffers: Buffer[],
  languageHints: string[],
): Promise<GoogleVisionResponse[]> {
  try {
    const [response] = await client.batchAnnotateImages({
      requests: imageBuffers.map((imageBuffer) => ({
        image: { content: imageBuffer },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: { languageHints },
      })),
    });

    return response.responses || [];
  } catch (error) {
    throw new Error(`Google Cloud Vision OCR failed: ${sanitizeErrorMessage(error)}`);
  }
}

function chunkGoogleInputs(
  items: { input: OcrBatchInput; imageBuffer: Buffer }[],
): { input: OcrBatchInput; imageBuffer: Buffer }[][] {
  const chunks: { input: OcrBatchInput; imageBuffer: Buffer }[][] = [];
  let currentChunk: { input: OcrBatchInput; imageBuffer: Buffer }[] = [];
  let currentBytes = 0;

  for (const item of items) {
    const itemBytes = item.imageBuffer.byteLength;
    const wouldExceedCount = currentChunk.length >= GOOGLE_VISION_BATCH_SIZE;
    const wouldExceedPayload =
      currentChunk.length > 0 && currentBytes + itemBytes > GOOGLE_VISION_SAFE_PAYLOAD_BYTES;

    if (wouldExceedCount || wouldExceedPayload) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentBytes = 0;
    }

    currentChunk.push(item);
    currentBytes += itemBytes;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function getGoogleVisionClientOptions(): GoogleVisionClientOptions {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return {};
  }

  const jsonCredentials = getGoogleCredentialsFromJson();
  if (jsonCredentials) {
    return jsonCredentials;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: normalizePrivateKey(privateKey),
      },
    };
  }

  throw new Error(
    'Google Cloud Vision credentials are not configured. Set GOOGLE_APPLICATION_CREDENTIALS ' +
      'to a service account JSON file path, or set GOOGLE_CLOUD_PROJECT_ID, ' +
      'GOOGLE_CLOUD_CLIENT_EMAIL, and GOOGLE_CLOUD_PRIVATE_KEY.',
  );
}

function getGoogleCredentialsFromJson(): GoogleVisionClientOptions | null {
  const rawCredentials = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;
  if (!rawCredentials) {
    return null;
  }

  let parsedCredentials: unknown;
  try {
    parsedCredentials = JSON.parse(rawCredentials);
  } catch {
    throw new Error(
      'Google Cloud Vision credentials are invalid. GOOGLE_CLOUD_CREDENTIALS_JSON must be valid JSON.',
    );
  }

  if (!isServiceAccountCredentials(parsedCredentials)) {
    throw new Error(
      'Google Cloud Vision credentials are incomplete. Required fields: project_id, client_email, private_key.',
    );
  }

  return {
    projectId: parsedCredentials.project_id,
    credentials: {
      client_email: parsedCredentials.client_email,
      private_key: normalizePrivateKey(parsedCredentials.private_key),
    },
  };
}

function isServiceAccountCredentials(value: unknown): value is {
  project_id: string;
  client_email: string;
  private_key: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'project_id' in value &&
    'client_email' in value &&
    'private_key' in value &&
    typeof value.project_id === 'string' &&
    typeof value.client_email === 'string' &&
    typeof value.private_key === 'string' &&
    value.project_id.length > 0 &&
    value.client_email.length > 0 &&
    value.private_key.length > 0
  );
}

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

function sanitizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || 'Unknown Google Vision error');
  let sanitized = message.replace(
    /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g,
    '[REDACTED_PRIVATE_KEY]',
  );

  for (const secret of [
    process.env.GOOGLE_CLOUD_PRIVATE_KEY,
    process.env.GOOGLE_CLOUD_CREDENTIALS_JSON,
  ]) {
    if (secret) {
      sanitized = sanitized.split(secret).join('[REDACTED_GOOGLE_CREDENTIAL]');
    }
  }

  return sanitized;
}

function extractRegionText(fullAnnotation: GoogleTextAnnotation, regions: TextRegion[]): string {
  const texts: string[] = [];

  for (const page of fullAnnotation.pages || []) {
    const pageWidth = page.width || 0;
    const pageHeight = page.height || 0;

    for (const region of regions) {
      const resolvedRegion = resolveRegionCoordinates(region, pageWidth, pageHeight);

      for (const block of page.blocks || []) {
        const v = block.boundingBox?.vertices;
        if (!v || v.length < 4) continue;

        const blockX = Math.min(...v.map((p) => p.x || 0));
        const blockY = Math.min(...v.map((p) => p.y || 0));
        const blockX2 = Math.max(...v.map((p) => p.x || 0));
        const blockY2 = Math.max(...v.map((p) => p.y || 0));
        const rx2 = resolvedRegion.x + resolvedRegion.width;
        const ry2 = resolvedRegion.y + resolvedRegion.height;
        const overlap =
          blockX < rx2 && blockX2 > resolvedRegion.x && blockY < ry2 && blockY2 > resolvedRegion.y;

        if (overlap) {
          texts.push(getBlockText(block));
        }
      }
    }
  }

  return texts.join('\n').trim();
}

function resolveRegionCoordinates(region: TextRegion, pageWidth: number, pageHeight: number): TextRegion {
  const isNormalized =
    pageWidth > 0 &&
    pageHeight > 0 &&
    region.x >= 0 &&
    region.y >= 0 &&
    region.width >= 0 &&
    region.height >= 0 &&
    region.x <= 1 &&
    region.y <= 1 &&
    region.width <= 1 &&
    region.height <= 1;

  if (!isNormalized) {
    return region;
  }

  return {
    x: region.x * pageWidth,
    y: region.y * pageHeight,
    width: region.width * pageWidth,
    height: region.height * pageHeight,
  };
}

function getBlockText(
  block: NonNullable<NonNullable<GoogleTextAnnotation['pages']>[number]['blocks']>[number],
): string {
  return (block.paragraphs || [])
    .flatMap((p) => (p.words || []).map((w) => (w.symbols || []).map((s) => s.text).join('')))
    .join(' ');
}

async function recognizeWithMock(
  _storagePath: string,
  language: string,
  regions?: TextRegion[],
): Promise<OcrResult> {
  await new Promise((r) => setTimeout(r, 100));

  const sampleText =
    language === 'pl'
      ? 'To jest przykładowy tekst rozpoznany przez OCR. Zażółć gęślą jaźń.'
      : 'This is sample text recognized by OCR. The quick brown fox jumps over the lazy dog.';

  const text = regions && regions.length > 0
    ? `[Region OCR] ${sampleText}`
    : sampleText;

  return { text, confidence: 0.95 };
}
