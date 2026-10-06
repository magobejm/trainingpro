import { createHmac, timingSafeEqual } from 'node:crypto';
import { assertPrivateStoragePath } from './private-storage-path';

const DEV_SIGNING_SECRET = 'dev-only-media-signing-secret';
const DEFAULT_TTL_SECONDS = 3600;

type SignerOptions = {
  baseUrl: string;
  now: () => number;
  secret: string;
  ttlSeconds: number;
};

export class PrivateMediaUrlSigner {
  constructor(private readonly options: SignerOptions) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env, now: () => number = () => Date.now()): PrivateMediaUrlSigner {
    const secret = readSigningSecret(env);
    const ttlSeconds = readTtlSeconds(env.PRIVATE_MEDIA_URL_TTL_SECONDS);
    const baseUrl = (env.PUBLIC_ASSET_BASE_URL ?? `http://localhost:${env.PORT ?? 8080}`).replace(/\/+$/, '');
    return new PrivateMediaUrlSigner({ baseUrl, now, secret, ttlSeconds });
  }

  sign(path: string): string {
    const objectPath = assertPrivateStoragePath(path);
    const exp = privateMediaExpiry(this.options.now(), this.options.ttlSeconds);
    const sig = signPayload(this.options.secret, objectPath, exp);
    const encoded = objectPath
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    return `${this.options.baseUrl}/files/private/${encoded}?exp=${exp}&sig=${sig}`;
  }

  verify(path: string, exp: string, sig: string): boolean {
    let objectPath: string;
    try {
      objectPath = assertPrivateStoragePath(path);
    } catch {
      return false;
    }
    const expiry = Number(exp);
    const nowSeconds = Math.floor(this.options.now() / 1000);
    if (!Number.isInteger(expiry) || expiry <= nowSeconds || expiry > nowSeconds + this.options.ttlSeconds) {
      return false;
    }
    if (!/^[0-9a-f]+$/i.test(sig) || sig.length % 2 !== 0) {
      return false;
    }
    const given = Buffer.from(sig, 'hex');
    const expected = Buffer.from(signPayload(this.options.secret, objectPath, expiry), 'hex');
    if (given.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(given, expected);
  }
}

export function privateMediaExpiry(nowMs: number, ttlSeconds: number): number {
  const nowSeconds = Math.floor(nowMs / 1000);
  const windowStart = Math.floor(nowSeconds / ttlSeconds) * ttlSeconds;
  return windowStart + ttlSeconds;
}

function signPayload(secret: string, path: string, exp: number): string {
  return createHmac('sha256', secret).update(`${path}\n${exp}`).digest('hex');
}

function readSigningSecret(env: NodeJS.ProcessEnv): string {
  const secret = env.MEDIA_URL_SIGNING_SECRET?.trim();
  const supabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_STORAGE_BUCKET);
  if (env.NODE_ENV === 'production' && supabaseConfigured && !secret) {
    throw new Error('Missing required env var: MEDIA_URL_SIGNING_SECRET');
  }
  return secret || DEV_SIGNING_SECRET;
}

function readTtlSeconds(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_SECONDS;
}
