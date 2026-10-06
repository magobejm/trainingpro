import type { NextFunction, Request, Response } from 'express';

export function blockPrivateUploadPaths(request: Request, response: Response, next: NextFunction): void {
  const relative = (request.path || '/').replace(/^\/+/, '');
  if (relative === 'clients' || relative.startsWith('clients/') || relative === 'chat' || relative.startsWith('chat/')) {
    response.status(404).end();
    return;
  }
  next();
}
