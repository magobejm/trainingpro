import {
  ApiClientError,
  createApiClient,
  isDayChangeConfirmationRequired,
  setUnauthorizedHandler,
  UnauthorizedApiError,
} from '../api-client';

describe('isDayChangeConfirmationRequired', () => {
  it('detects the 409 confirmation code', () => {
    expect(isDayChangeConfirmationRequired(new ApiClientError('DAY_CHANGE_CONFIRMATION_REQUIRED', 409))).toBe(true);
    expect(isDayChangeConfirmationRequired(new ApiClientError('Unexpected API error', 409))).toBe(false);
    expect(isDayChangeConfirmationRequired(new ApiClientError('DAY_CHANGE_CONFIRMATION_REQUIRED', 400))).toBe(false);
  });
});

describe('api client failures', () => {
  it('keeps the request id and leaves the token out of the failure log', async () => {
    const requestId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    const token = 'secret-token';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchMock = jest.fn().mockResolvedValue(failedResponse(requestId));
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = createApiClient({
      accessToken: token,
      activeRole: 'client',
      baseUrl: 'http://localhost:8080',
    });
    await expect(client.post('/sessions/session-1/log-set', { repsDone: 8 })).rejects.toMatchObject({
      message: 'Session access denied',
      requestId,
      status: 403,
    });
    const printed = warn.mock.calls.map((call) => String(call[0])).join('\n');
    expect(printed).toContain(requestId);
    expect(printed).toContain('/sessions/session-1/log-set');
    expect(printed).not.toContain(token);
    expect(printed).not.toContain('repsDone');
    const headers = fetchMock.mock.calls[0]?.[1] as { headers?: Record<string, string> };
    expect(headers.headers?.['X-Request-Id']).toBeTruthy();
    warn.mockRestore();
  });
});

it.each(['120', '840'])('sends a single timezone offset when an override uses lowercase headers (%s)', async (offset) => {
  const timezone = jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-120);
  const originalFetch = global.fetch;
  const fetchMock = jest.fn().mockResolvedValue(fakeResponse(200, '{}'));
  global.fetch = fetchMock as unknown as typeof fetch;
  try {
    await createApiClient({ activeRole: 'coach', baseUrl: 'http://localhost:8081' }).get('/progress/adherence', {
      'x-timezone-offset': offset,
    });
    const request = fetchMock.mock.calls[0]![1] as { headers: Record<string, string> };
    expect(new Headers(request.headers).get('x-timezone-offset')).toBe(offset);
  } finally {
    global.fetch = originalFetch;
    timezone.mockRestore();
  }
});

function failedResponse(requestId: string): {
  headers: { get: (name: string) => string | null };
  json: () => Promise<Record<string, never>>;
  ok: boolean;
  status: number;
  text: () => Promise<string>;
} {
  return {
    headers: { get: (name: string) => (name.toLowerCase() === 'x-request-id' ? requestId : null) },
    json: async () => ({}),
    ok: false,
    status: 403,
    text: async () =>
      JSON.stringify({
        error: 'Forbidden',
        message: 'Session access denied',
        requestId,
        statusCode: 403,
      }),
  };
}

describe('global unauthorized handler and empty bodies', () => {
  afterEach(() => setUnauthorizedHandler(null));

  it('reports a 401 with the request token, unless the client opts out', async () => {
    const handler = jest.fn();
    setUnauthorizedHandler(handler);
    global.fetch = jest
      .fn()
      .mockResolvedValue(fakeResponse(401, JSON.stringify({ message: 'Unauthorized' }))) as unknown as typeof fetch;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const base = { accessToken: 'tok-1', activeRole: 'client' as const, baseUrl: 'http://localhost:8080' };
    await expect(createApiClient(base).get('/clients/me')).rejects.toBeInstanceOf(UnauthorizedApiError);
    expect(handler).toHaveBeenCalledWith('tok-1');
    handler.mockClear();
    await expect(createApiClient({ ...base, skipUnauthorizedHandler: true }).get('/users/me')).rejects.toBeInstanceOf(
      UnauthorizedApiError,
    );
    expect(handler).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it.each([204, 200])('returns undefined for an empty body (%s)', async (status) => {
    global.fetch = jest.fn().mockResolvedValue(fakeResponse(status, '')) as unknown as typeof fetch;
    const client = createApiClient({ accessToken: 't', activeRole: 'client', baseUrl: 'http://localhost:8080' });
    await expect(client.post('/x', {})).resolves.toBeUndefined();
  });
});

function fakeResponse(status: number, body: string): unknown {
  return {
    headers: { get: () => null },
    json: async () => JSON.parse(body || 'null'),
    ok: status < 400,
    status,
    text: async () => body,
  };
}
