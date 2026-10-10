import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { readRequestContext } from './request-context';
import { publicLogMessage, writeRequestLog } from './request-log';
import { isStaticPath, moduleOf, routeOf } from './request-route';

@Catch()
@Injectable()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const context = readRequestContext(request);
    const status = statusOf(exception);
    const body = errorBody(exception, status, context.requestId);
    response.setHeader('X-Request-Id', context.requestId);
    if (!isStaticPath(request.path || '')) {
      writeRequestLog({
        durationMs: Math.max(0, Date.now() - context.startedAt),
        ...errorFields(exception, status, body),
        method: request.method || 'GET',
        module: moduleOf(routeOf(request)),
        requestId: context.requestId,
        route: routeOf(request),
        status,
      });
    }
    response.status(status).json(body);
  }
}

function statusOf(exception: unknown): number {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }
  return 500;
}

function errorBody(exception: unknown, status: number, requestId: string): Record<string, unknown> {
  if (!(exception instanceof HttpException) || status >= 500) {
    return {
      error: 'Internal Server Error',
      message: 'Internal server error',
      requestId,
      statusCode: status,
    };
  }
  const payload = exception.getResponse();
  if (typeof payload === 'string') {
    return { error: 'Error', message: payload, requestId, statusCode: status };
  }
  const record = payload && typeof payload === 'object' ? { ...(payload as Record<string, unknown>) } : {};
  delete record.stack;
  return { ...record, requestId };
}

function errorFields(
  exception: unknown,
  status: number,
  body: Record<string, unknown>,
): { errorName?: string; message?: string; prismaCode?: string } {
  if (status < 500) {
    const message = publicLogMessage(body.message);
    return message ? { message } : {};
  }
  const fields: { errorName?: string; prismaCode?: string } = { errorName: errorName(exception) };
  const prismaCode = readPrismaCode(exception);
  if (prismaCode) {
    fields.prismaCode = prismaCode;
  }
  return fields;
}

function errorName(exception: unknown): string {
  if (exception instanceof Error && exception.name) {
    return exception.name;
  }
  return 'Error';
}

function readPrismaCode(exception: unknown): string | undefined {
  if (!exception || typeof exception !== 'object') {
    return undefined;
  }
  const record = exception as { code?: unknown; name?: unknown };
  if (typeof record.name !== 'string' || !record.name.startsWith('Prisma')) {
    return undefined;
  }
  if (typeof record.code !== 'string' || !/^P[0-9A-Z]+$/.test(record.code)) {
    return undefined;
  }
  return record.code;
}
