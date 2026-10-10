import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { readRequestContext } from './request-context';
import { writeRequestLog } from './request-log';
import { isStaticPath, moduleOf, routeOf } from './request-route';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<Request>();
    if (isStaticPath(request.path || '')) {
      return next.handle();
    }
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        if (response.statusCode >= 400) {
          return;
        }
        const state = readRequestContext(request);
        const route = routeOf(request);
        writeRequestLog({
          durationMs: Math.max(0, Date.now() - state.startedAt),
          method: request.method || 'GET',
          module: moduleOf(route),
          requestId: state.requestId,
          route,
          status: response.statusCode,
        });
      }),
    );
  }
}
