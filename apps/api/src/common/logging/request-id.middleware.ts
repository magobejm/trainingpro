import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { bindRequestContext, requestContext } from './request-context';
import { resolveRequestId } from './request-id';
import { isStaticPath } from './request-route';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    if (isStaticPath(request.path)) {
      next();
      return;
    }
    const context = {
      requestId: resolveRequestId(request.header('x-request-id')),
      startedAt: Date.now(),
    };
    bindRequestContext(request, context);
    response.setHeader('X-Request-Id', context.requestId);
    requestContext.run(context, () => next());
  }
}
