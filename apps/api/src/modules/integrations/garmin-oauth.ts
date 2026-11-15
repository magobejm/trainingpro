const GARMIN_TOKEN_URL = 'https://diauth.garmin.com/di-oauth2-service/oauth/token';
const GARMIN_USER_URL = 'https://apis.garmin.com/wellness-api/rest/user/id';
const EXPIRY_SKEW_SECONDS = 600;

export type GarminTokenSet = {
  accessToken: string;
  expiresAt: Date;
  externalUserId: string;
  refreshToken: string;
  scopes: string[];
};

type GarminCodeInput = {
  clientId: string;
  clientSecret: string;
  code: string;
  codeVerifier: string;
  now?: Date;
  redirectUri: string;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

export async function exchangeGarminCode(input: GarminCodeInput, fetchImpl: typeof fetch = fetch): Promise<GarminTokenSet> {
  const token = await requestToken(input, fetchImpl);
  const externalUserId = await requestUserId(token.access_token, fetchImpl);
  const lifetime = Math.max(60, token.expires_in - EXPIRY_SKEW_SECONDS);
  const now = input.now ?? new Date();
  return {
    accessToken: token.access_token,
    expiresAt: new Date(now.getTime() + lifetime * 1000),
    externalUserId,
    refreshToken: token.refresh_token,
    scopes: token.scope.split(/[ ,]+/).filter((scope) => scope.length > 0),
  };
}

async function requestToken(
  input: GarminCodeInput,
  fetchImpl: typeof fetch,
): Promise<{ access_token: string; expires_in: number; refresh_token: string; scope: string }> {
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    code: input.code,
    code_verifier: input.codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: input.redirectUri,
  });
  const response = await fetchImpl(GARMIN_TOKEN_URL, {
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  if (!response.ok) throw new Error('Garmin token exchange failed');
  const token = (await response.json()) as TokenResponse;
  if (!token.access_token || !token.refresh_token || typeof token.expires_in !== 'number') {
    throw new Error('Garmin token exchange failed');
  }
  return {
    access_token: token.access_token,
    expires_in: token.expires_in,
    refresh_token: token.refresh_token,
    scope: token.scope ?? '',
  };
}

async function requestUserId(accessToken: string, fetchImpl: typeof fetch): Promise<string> {
  const response = await fetchImpl(GARMIN_USER_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error('Garmin user id failed');
  const text = (await response.text()).trim();
  try {
    const parsed = JSON.parse(text) as { userId?: unknown };
    if (typeof parsed.userId === 'string' && parsed.userId.length > 0) return parsed.userId;
  } catch {
    const plain = text.replace(/^"|"$/g, '');
    if (plain.length > 0) return plain;
  }
  throw new Error('Garmin user id failed');
}
