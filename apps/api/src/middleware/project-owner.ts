import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';
import { routeParam } from '../lib/route-params';

export async function requireProjectOwner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const projectId = routeParam(req, 'id') || routeParam(req, 'projectId');
  if (!projectId) {
    res.status(400).json({ error: 'Bad Request', message: 'Project ID required', statusCode: 400 });
    return;
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found', statusCode: 404 });
    return;
  }

  if (project.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden', message: 'Access denied', statusCode: 403 });
    return;
  }

  next();
}
