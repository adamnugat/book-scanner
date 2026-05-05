import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';

const SECRET: Secret = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_EXPIRES = (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
const REFRESH_EXPIRES = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
const ASSET_EXPIRES = (process.env.JWT_ASSET_EXPIRES_IN || '1h') as SignOptions['expiresIn'];

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
