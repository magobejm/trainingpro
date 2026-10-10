/**
 * Hosts that may call the API from a browser. This list is not authentication
 * and does not decide who owns a resource.
 *
 * Local: web on 5173 and mobile web on 19006.
 * Firebase: production and preview channels of OWN_FIREBASE_SITES. A preview is
 * `https://<site>--<channel>.web.app` and the same name on firebaseapp.com.
 * Add a site id here when hosting moves. The live site in CORS_ORIGINS is also
 * accepted, together with its preview channels. Keep a single origin in that
 * variable: the Cloud Run deploy splits on commas.
 * Expo: production and previews of the slug trainer-pro-mobile
 * (`https://trainer-pro-mobile--<hash>.expo.app`).
 */
const LOCAL_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
]);

const OWN_FIREBASE_SITES = ['trainerpro-prod'];
const EXPO_SLUG = 'trainer-pro-mobile';
const FIREBASE_SUFFIXES = ['.web.app', '.firebaseapp.com'];

export function originIsAllowed(origin: string | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!origin) {
    return true;
  }
  const normalized = origin.toLowerCase();
  return (
    LOCAL_ORIGINS.has(normalized) ||
    envOrigins(env).includes(normalized) ||
    firebaseOriginAllowed(normalized, env) ||
    expoOriginAllowed(normalized)
  );
}

export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  if (originIsAllowed(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`Origin not allowed by CORS: ${origin}`), false);
}

function envOrigins(env: NodeJS.ProcessEnv): string[] {
  return (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function firebaseOriginAllowed(origin: string, env: NodeJS.ProcessEnv): boolean {
  const host = httpsHost(origin);
  if (!host) {
    return false;
  }
  const sites = firebaseSites(env);
  return sites.some((site) => hostMatchesSite(host, site));
}

function firebaseSites(env: NodeJS.ProcessEnv): string[] {
  const fromEnv = envOrigins(env)
    .map(siteFromExactOrigin)
    .filter((site): site is string => site !== null);
  return [...new Set([...OWN_FIREBASE_SITES, ...fromEnv])];
}

function siteFromExactOrigin(origin: string): string | null {
  const host = httpsHost(origin);
  if (!host) {
    return null;
  }
  const suffix = FIREBASE_SUFFIXES.find((item) => host.endsWith(item));
  if (!suffix) {
    return null;
  }
  const name = host.slice(0, -suffix.length);
  return name.includes('--') ? null : name;
}

function hostMatchesSite(host: string, site: string): boolean {
  const suffix = FIREBASE_SUFFIXES.find((item) => host.endsWith(item));
  if (!suffix) {
    return false;
  }
  const name = host.slice(0, -suffix.length);
  if (name === site) {
    return true;
  }
  const prefix = `${site}--`;
  if (!name.startsWith(prefix)) {
    return false;
  }
  return channelName(name.slice(prefix.length));
}

function expoOriginAllowed(origin: string): boolean {
  const host = httpsHost(origin);
  if (!host?.endsWith('.expo.app')) {
    return false;
  }
  const name = host.slice(0, -'.expo.app'.length);
  if (name === EXPO_SLUG) {
    return true;
  }
  const prefix = `${EXPO_SLUG}--`;
  return name.startsWith(prefix) && channelName(name.slice(prefix.length));
}

function httpsHost(origin: string): string | null {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    return null;
  }
  return url.hostname;
}

function channelName(channel: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(channel);
}
