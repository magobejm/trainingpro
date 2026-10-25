import { createHash, randomBytes } from 'node:crypto';

export const CLOUD_PROVIDERS = ['garmin', 'polar', 'strava'] as const;
export type CloudProvider = (typeof CLOUD_PROVIDERS)[number];

const SCOPES: Record<CloudProvider, string> = {
  garmin: 'ACTIVITY_READ HEALTH_READ TRAINING_WRITE',
  polar: 'accesslink.read_all',
  strava: 'activity:write',
};

export function providerConfigured(provider: CloudProvider): boolean {
  if (provider === 'garmin') return Boolean(process.env.GARMIN_CLIENT_ID && process.env.GARMIN_CLIENT_SECRET);
  if (provider === 'polar') return Boolean(process.env.POLAR_CLIENT_ID && process.env.POLAR_CLIENT_SECRET);
  return Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
}

export function authorizeUrl(
  provider: CloudProvider,
  input: { codeChallenge: string; redirectUri: string; state: string },
): string {
  const params = new URLSearchParams({
    code_challenge: input.codeChallenge,
    code_challenge_method: 'S256',
    redirect_uri: input.redirectUri,
    response_type: 'code',
    scope: SCOPES[provider],
    state: input.state,
  });
  if (provider === 'garmin') params.set('client_id', process.env.GARMIN_CLIENT_ID ?? '');
  if (provider === 'polar') params.set('client_id', process.env.POLAR_CLIENT_ID ?? '');
  if (provider === 'strava') params.set('client_id', process.env.STRAVA_CLIENT_ID ?? '');
  const host =
    provider === 'garmin'
      ? 'https://connect.garmin.com/oauth2Confirm'
      : provider === 'polar'
        ? 'https://flow.polar.com/oauth2/authorization'
        : 'https://www.strava.com/oauth/authorize';
  return `${host}?${params.toString()}`;
}

export function createPkce(): { challenge: string; verifier: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { challenge, verifier };
}

export function toPrismaProvider(provider: CloudProvider): 'GARMIN' | 'POLAR' | 'STRAVA' {
  return provider.toUpperCase() as 'GARMIN' | 'POLAR' | 'STRAVA';
}
