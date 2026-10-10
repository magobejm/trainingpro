import { ApiClientError, createApiClient, isDayChangeConfirmationRequired } from '../api-client';

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
