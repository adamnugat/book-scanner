import { Router } from 'express';
import type { ApiHealthResponse } from '@book-scanner/shared';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const response: ApiHealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.0.1',
  };
  res.json(response);
});
