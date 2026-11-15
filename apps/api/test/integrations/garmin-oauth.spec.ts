import { exchangeGarminCode } from '../../src/modules/integrations/garmin-oauth';
import { authorizeUrl } from '../../src/modules/integrations/integration-providers';

describe('Garmin OAuth', () => {
  const originalClientId = process.env.GARMIN_CLIENT_ID;

  afterEach(() => {
    process.env.GARMIN_CLIENT_ID = originalClientId;
  });

  it('asks Garmin for a code without sending scopes', () => {
    process.env.GARMIN_CLIENT_ID = 'garmin-client';
    const url = new URL(
      authorizeUrl('garmin', {
        codeChallenge: 'challenge',
        redirectUri: 'https://api.example/integrations/garmin/callback',
        state: 'signed-state',
      }),
    );

    expect(url.origin + url.pathname).toBe('https://connect.garmin.com/oauth2Confirm');
    expect(url.searchParams.get('scope')).toBeNull();
    expect(url.searchParams.get('code_challenge')).toBe('challenge');
    expect(url.searchParams.get('client_id')).toBe('garmin-client');
    expect(url.searchParams.get('redirect_uri')).toBe('https://api.example/integrations/garmin/callback');
  });

  it('exchanges the code and shortens the access token lifetime', async () => {
    const now = new Date('2026-11-15T12:00:00.000Z');
    const fetchImpl = jest.fn(async (...args: [string, { body?: URLSearchParams }?]) => {
      const url = args[0];
      if (String(url).includes('/oauth/token')) {
        return json({
          access_token: 'access',
          expires_in: 86400,
          refresh_token: 'refresh',
          scope: 'PARTNER_WRITE',
        });
      }
      return text('{"userId":"garmin-user"}');
    });

    const tokens = await exchangeGarminCode(
      {
        clientId: 'client',
        clientSecret: 'secret',
        code: 'auth-code',
        codeVerifier: 'verifier',
        now,
        redirectUri: 'https://api.example/integrations/garmin/callback',
      },
      fetchImpl as unknown as typeof fetch,
    );

    expect(tokens.accessToken).toBe('access');
    expect(tokens.refreshToken).toBe('refresh');
    expect(tokens.externalUserId).toBe('garmin-user');
    expect(tokens.expiresAt.toISOString()).toBe('2026-11-16T11:50:00.000Z');
    const request = fetchImpl.mock.calls[0]?.[1];
    expect(request?.body?.get('grant_type')).toBe('authorization_code');
    expect(request?.body?.get('code_verifier')).toBe('verifier');
    expect(request?.body?.get('client_secret')).toBe('secret');
  });

  it('rejects a token response without a refresh token', async () => {
    const fetchImpl = jest.fn(async () => json({ access_token: 'access', expires_in: 86400 }));
    await expect(
      exchangeGarminCode(
        {
          clientId: 'client',
          clientSecret: 'secret',
          code: 'auth-code',
          codeVerifier: 'verifier',
          redirectUri: 'https://api.example/callback',
        },
        fetchImpl as unknown as typeof fetch,
      ),
    ).rejects.toThrow(/token/);
  });
});

function json(body: unknown): Response {
  return { json: async () => body, ok: true, text: async () => JSON.stringify(body) } as Response;
}

function text(body: string): Response {
  return { json: async () => JSON.parse(body), ok: true, text: async () => body } as Response;
}
