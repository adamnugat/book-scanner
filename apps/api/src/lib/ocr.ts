import { downloadFile } from './storage';

export interface OcrResult {
  text: string;
  confidence?: number;
}

export async function recognizeText(
  storagePath: string,
  language: string,
  regions?: { x: number; y: number; width: number; height: number }[],
): Promise<OcrResult> {
  if (process.env.OCR_PROVIDER === 'google') {
    return recognizeWithGoogle(storagePath, language, regions);
  }
  return recognizeWithMock(storagePath, language, regions);
}

async function recognizeWithGoogle(
  storagePath: string,
  language: string,
  regions?: { x: number; y: number; width: number; height: number }[],
): Promise<OcrResult> {
  const imageBuffer = await downloadFile(storagePath);
  const base64Image = imageBuffer.toString('base64');

  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_CLOUD_API_KEY not configured');

  const languageHints = language === 'pl' ? ['pl', 'en'] : ['en', 'pl'];

  const features = regions && regions.length > 0
    ? [{ type: 'DOCUMENT_TEXT_DETECTION' }]
    : [{ type: 'TEXT_DETECTION' }];

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features,
            imageContext: { languageHints },
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Vision API error: ${err}`);
  }

  const data = await response.json();
  const annotations = data.responses?.[0];

  if (annotations?.error) {
    throw new Error(`OCR error: ${annotations.error.message}`);
  }

  const fullText =
    annotations?.fullTextAnnotation?.text ||
    annotations?.textAnnotations?.[0]?.description ||
    '';

  if (regions && regions.length > 0 && annotations?.fullTextAnnotation) {
    const croppedText = extractRegionText(annotations.fullTextAnnotation, regions);
    return { text: croppedText || fullText };
  }

  return { text: fullText.trim() };
}

function extractRegionText(
  fullAnnotation: { pages?: Array<{ blocks?: Array<{ boundingBox?: { vertices?: Array<{ x: number; y: number }> }; paragraphs?: Array<{ words?: Array<{ symbols?: Array<{ text: string }> }> }> }> }> },
  regions: { x: number; y: number; width: number; height: number }[],
): string {
  const texts: string[] = [];

  for (const page of fullAnnotation.pages || []) {
    for (const block of page.blocks || []) {
      const v = block.boundingBox?.vertices;
      if (!v || v.length < 4) continue;

      const blockX = Math.min(...v.map((p) => p.x || 0));
      const blockY = Math.min(...v.map((p) => p.y || 0));
      const blockX2 = Math.max(...v.map((p) => p.x || 0));
      const blockY2 = Math.max(...v.map((p) => p.y || 0));

      for (const region of regions) {
        const rx2 = region.x + region.width;
        const ry2 = region.y + region.height;
        const overlap =
          blockX < rx2 && blockX2 > region.x && blockY < ry2 && blockY2 > region.y;

        if (overlap) {
          const blockText = (block.paragraphs || [])
            .flatMap((p) => (p.words || []).map((w) => (w.symbols || []).map((s) => s.text).join('')))
            .join(' ');
          texts.push(blockText);
          break;
        }
      }
    }
  }

  return texts.join('\n').trim();
}

async function recognizeWithMock(
  _storagePath: string,
  language: string,
  regions?: { x: number; y: number; width: number; height: number }[],
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
