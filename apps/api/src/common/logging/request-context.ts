import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request } from 'express';

export type RequestContext = {
  requestId: string;
  startedAt: number;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

type LoggedRequest = Request & { requestLog?: RequestContext };

export function bindRequestContext(request: Request, context: RequestContext): void {
  (request as LoggedRequest).requestLog = context;
}

export function readRequestContext(request: Request): RequestContext {
  const stored = requestContext.getStore() ?? (request as LoggedRequest).requestLog;
  if (stored) {
    return stored;
  }
  return { requestId: 'unknown', startedAt: Date.now() };
}
