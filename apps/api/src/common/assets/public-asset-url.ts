export const BUNDLED_ASSET_PREFIX = '/assets/exercises/';

export function resolvePublicAssetBaseUrl(): string {
  return process.env.PUBLIC_ASSET_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
}

// Bundled images are stored as host-less paths so one DB value works in every environment.
export function absolutizeAssetPaths<T>(value: T, baseUrl: string): T {
  const base = baseUrl.replace(/\/+$/, '');
  return rewrite(value, base) as T;
}

function rewrite(value: unknown, base: string): unknown {
  if (typeof value === 'string') {
    return value.startsWith(BUNDLED_ASSET_PREFIX) ? `${base}${value}` : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewrite(item, base));
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = rewrite(item, base);
    }
    return out;
  }
  return value;
}
