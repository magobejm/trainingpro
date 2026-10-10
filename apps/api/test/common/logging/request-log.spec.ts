import { ArgumentsHost } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { HttpErrorFilter } from '../../../src/common/logging/http-error.filter';
import { bindRequestContext } from '../../../src/common/logging/request-context';
import { TOKEN_VERIFIER } from '../../../src/modules/auth/domain/token-verifier.token';
import { SESSIONS_REPOSITORY } from '../../../src/modules/sessions/domain/sessions-repository.port';

const REQUEST_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const SESSION_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ITEM_ID = '33333333-3333-4333-8333-333333333333';

if (!process.env.SUPABASE_PRIVATE_STORAGE_BUCKET?.trim()) {
  process.env.SUPABASE_PRIVATE_STORAGE_BUCKET = 'test-private';
}

describe('request log', () => {
  it('hides internal 500 details and keeps the request id', () => {
    const logs = captureStdout();
    const secret = 'connection string Bearer secret-token';
    const failure = new Error(secret);
    failure.stack = `Error: ${secret}\n    at secret.ts:1`;
    const response = jsonResponse();
    const httpRequest = loggedRequest();
    new HttpErrorFilter().catch(failure, host(httpRequest, response as unknown as Response));
    const body = response.json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body).toEqual({
      error: 'Internal Server Error',
      message: 'Internal server error',
      requestId: REQUEST_ID,
      statusCode: 500,
    });
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(JSON.stringify(body)).not.toContain('stack');
    const line = logs.events().find((event) => event.requestId === REQUEST_ID);
    expect(line).toMatchObject({
      errorName: 'Error',
      module: 'sessions',
      route: '/sessions/:sessionId/log-set',
      status: 500,
    });
    expect(JSON.stringify(line)).not.toContain('secret');
    expect(JSON.stringify(line)).not.toContain('Bearer');
    logs.stop();
  });

  it('logs a prisma code without the driver message', () => {
    const logs = captureStdout();
    const failure = new Error('unique violation on email user@example.com');
    failure.name = 'PrismaClientKnownRequestError';
    (failure as Error & { code: string }).code = 'P2002';
    const response = jsonResponse();
    new HttpErrorFilter().catch(failure, host(loggedRequest(), response as unknown as Response));
    const body = JSON.stringify(response.json.mock.calls[0]?.[0]);
    expect(body).not.toContain('user@example.com');
    const line = logs.events().find((event) => event.status === 500);
    expect(line).toMatchObject({ errorName: 'PrismaClientKnownRequestError', prismaCode: 'P2002' });
    expect(JSON.stringify(line)).not.toContain('user@example.com');
    logs.stop();
  });

  it('follows a rejected log-set from the request id to the sessions log', async () => {
    const logs = captureStdout();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue({
        verify: async () => ({ email: 'coach-a@fitcoach.local', roles: ['coach'], subject: 'coach-a' }),
      })
      .overrideProvider(SESSIONS_REPOSITORY)
      .useValue({ canAccessSession: async () => false })
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    try {
      const response = await request(app.getHttpServer())
        .post(`/sessions/${SESSION_ID}/log-set`)
        .set('Authorization', 'Bearer coach-a')
        .set('x-active-role', 'coach')
        .set('x-request-id', REQUEST_ID)
        .send({ repsDone: 8, sessionItemId: ITEM_ID, setIndex: 1 });
      expect(response.status).toBe(403);
      expect(response.headers['x-request-id']).toBe(REQUEST_ID);
      expect(response.body).toMatchObject({
        message: 'Session access denied',
        requestId: REQUEST_ID,
        statusCode: 403,
      });
      const line = logs.events().find((event) => event.requestId === REQUEST_ID && event.status === 403);
      expect(line).toMatchObject({
        message: 'Session access denied',
        method: 'POST',
        module: 'sessions',
        route: '/sessions/:sessionId/log-set',
        status: 403,
      });
      expect(typeof line?.durationMs).toBe('number');
      const printed = JSON.stringify(line);
      expect(printed).not.toContain('Bearer');
      expect(printed).not.toContain('repsDone');
      expect(printed).not.toContain(ITEM_ID);
    } finally {
      await app.close();
      logs.stop();
    }
  });
});

function loggedRequest(): Request {
  const httpRequest = {
    method: 'POST',
    path: `/sessions/${SESSION_ID}/log-set`,
    route: { path: '/sessions/:sessionId/log-set' },
  } as Request;
  bindRequestContext(httpRequest, { requestId: REQUEST_ID, startedAt: Date.now() });
  return httpRequest;
}

function host(httpRequest: Request, response: Response): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => httpRequest,
      getResponse: () => response,
    }),
  } as ArgumentsHost;
}

function jsonResponse(): { json: jest.Mock; setHeader: jest.Mock; status: jest.Mock } {
  const response = {
    json: jest.fn(),
    setHeader: jest.fn(),
    status: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

function captureStdout(): { events: () => Array<Record<string, unknown>>; stop: () => void } {
  const chunks: string[] = [];
  const spy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    chunks.push(String(chunk));
    return true;
  });
  return {
    events: () =>
      chunks
        .join('')
        .split('\n')
        .flatMap((line) => parseEvent(line)),
    stop: () => spy.mockRestore(),
  };
}

function parseEvent(line: string): Array<Record<string, unknown>> {
  if (!line.includes('requestId')) {
    return [];
  }
  try {
    return [JSON.parse(line) as Record<string, unknown>];
  } catch {
    return [];
  }
}
