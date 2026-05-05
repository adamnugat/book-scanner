import type { ImagePickerAsset } from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface UploadableImageFile {
  uri: string;
  name: string;
  type: string;
}

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
};

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

function extensionFromPath(path: string | null | undefined): string | null {
  if (!path) return null;
  const cleanPath = path.split(/[?#]/)[0];
  const match = /\.([a-z0-9]+)$/i.exec(cleanPath);
  return match?.[1]?.toLowerCase() ?? null;
}

function isHeicMimeType(mimeType: string): boolean {
  return mimeType === 'image/heic' || mimeType === 'image/heif';
}

function replaceExtension(fileName: string, extension: string): string {
  if (/\.[a-z0-9]+$/i.test(fileName)) {
    return fileName.replace(/\.[a-z0-9]+$/i, `.${extension}`);
  }

  return `${fileName}.${extension}`;
}

export function imageMimeTypeFromAsset(
  asset: Pick<ImagePickerAsset, 'fileName' | 'mimeType' | 'uri'>,
): string {
  const explicitMimeType = asset.mimeType?.toLowerCase();
  if (explicitMimeType && explicitMimeType in EXTENSION_BY_MIME_TYPE) {
    return explicitMimeType;
  }

  const extension = extensionFromPath(asset.fileName) ?? extensionFromPath(asset.uri);
  if (extension && extension in MIME_TYPE_BY_EXTENSION) {
    return MIME_TYPE_BY_EXTENSION[extension];
  }

  return 'image/jpeg';
}

export function uploadFileFromImagePickerAsset(
  asset: ImagePickerAsset,
  index: number,
): Promise<UploadableImageFile> {
  const type = imageMimeTypeFromAsset(asset);
  const fallbackExtension = EXTENSION_BY_MIME_TYPE[type] ?? 'jpg';
  const name = asset.fileName || `page-${Date.now()}-${index}.${fallbackExtension}`;

  if (isHeicMimeType(type)) {
    return manipulateAsync(asset.uri, [], {
      compress: 0.9,
      format: SaveFormat.JPEG,
    }).then((converted) => ({
      uri: converted.uri,
      name: replaceExtension(name, 'jpg'),
      type: 'image/jpeg',
    }));
  }

  return Promise.resolve({
    uri: asset.uri,
    name,
    type,
  });
}
