import type { Request, Response, NextFunction } from 'express';

export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const status = (err as Error & { status?: number }).status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error('[ERROR]', err.message, err.stack);
  }

  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : 'Error',
    message,
    statusCode: status,
  });
}
