import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const ASSET_EXPIRES = process.env.JWT_ASSET_EXPIRES_IN || '1h';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AssetTokenPayload {
  userId: string;
  projectId: string;
  imageId: string;
  variant: 'file' | 'thumbnail';
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: REFRESH_EXPIRES });
}

export function signAssetToken(payload: AssetTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: ASSET_EXPIRES });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}

export function verifyAssetToken(token: string): AssetTokenPayload {
  return jwt.verify(token, SECRET) as AssetTokenPayload;
}
