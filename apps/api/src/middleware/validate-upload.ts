import type { Request, Response, NextFunction } from 'express';

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/heic': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]],
};

function matchesMagicBytes(buffer: Buffer, expected: number[]): boolean {
  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

export function validateUploadContent(req: Request, res: Response, next: NextFunction): void {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files) {
    next();
    return;
  }

  for (const file of files) {
    const patterns = MAGIC_BYTES[file.mimetype];
    if (!patterns) {
      res.status(400).json({
        error: 'Validation failed',
        message: `Rejected file "${file.originalname}": unsupported type ${file.mimetype}`,
        statusCode: 400,
      });
      return;
    }

    const hasValidMagic = patterns.some((pattern) => matchesMagicBytes(file.buffer, pattern));
    if (!hasValidMagic) {
      res.status(400).json({
        error: 'Validation failed',
        message: `Rejected file "${file.originalname}": file content does not match declared type ${file.mimetype}`,
        statusCode: 400,
      });
      return;
    }
  }

  next();
}
