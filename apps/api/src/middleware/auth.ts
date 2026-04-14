import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../lib/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token', statusCode: 401 });
    return;
  }

  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Token expired or invalid', statusCode: 401 });
  }
}
