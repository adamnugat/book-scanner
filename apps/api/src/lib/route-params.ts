import type { Request } from 'express';

export function routeParam(req: Request, name: string): string | undefined {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}

export function requireRouteParam(req: Request, name: string): string {
  const value = routeParam(req, name);
  if (!value) {
    throw new Error(`Missing route parameter: ${name}`);
  }
  return value;
}
