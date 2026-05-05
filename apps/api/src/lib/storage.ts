import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import type { BucketLocationConstraint, CreateBucketCommandInput } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({
  region: process.env.STORAGE_REGION || 'us-east-1',
  endpoint: process.env.STORAGE_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.STORAGE_SECRET_KEY || '',
  },
});

const BUCKET = process.env.STORAGE_BUCKET || 'book-scanner';
let bucketReadyPromise: Promise<void> | null = null;

async function createBucketIfMissing(): Promise<void> {
  try {
    await s3.send(
      new HeadBucketCommand({
        Bucket: BUCKET,
      }),
    );
    return;
  } catch {
    try {
      const createBucketInput: CreateBucketCommandInput = { Bucket: BUCKET };
      if (process.env.STORAGE_REGION && process.env.STORAGE_REGION !== 'us-east-1') {
        createBucketInput.CreateBucketConfiguration = {
          LocationConstraint: process.env.STORAGE_REGION as BucketLocationConstraint,
        };
      }

      await s3.send(new CreateBucketCommand(createBucketInput));
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'name' in error ? String(error.name) : '';
      if (code !== 'BucketAlreadyOwnedByYou' && code !== 'BucketAlreadyExists') {
        throw error;
      }
    }
  }
}

async function ensureBucketExists(): Promise<void> {
  if (!bucketReadyPromise) {
    bucketReadyPromise = createBucketIfMissing().catch((error) => {
      bucketReadyPromise = null;
      throw error;
    });
  }

  await bucketReadyPromise;
}

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  await ensureBucketExists();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

export async function downloadFile(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function downloadFileWithMetadata(key: string): Promise<{ body: Buffer; contentType?: string }> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return {
    body: Buffer.concat(chunks),
    contentType: response.ContentType,
  };
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
