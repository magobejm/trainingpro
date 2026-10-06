import { PrivateMediaUrlSigner, privateMediaExpiry } from '../../src/modules/files/domain/private-media-url-signer';

const SECRET = 'test-secret';
const PATH = 'clients/avatars/client-1/photo.jpg';

function signerAt(nowMs: number, ttlSeconds = 3600): PrivateMediaUrlSigner {
  return new PrivateMediaUrlSigner({
    baseUrl: 'http://localhost:8080',
    now: () => nowMs,
    secret: SECRET,
    ttlSeconds,
  });
}

describe('PrivateMediaUrlSigner', () => {
  const nowMs = 1_700_000_100_000;

  it('keeps the same URL inside one expiry window', () => {
    const signer = signerAt(nowMs);
    expect(signer.sign(PATH)).toBe(signer.sign(PATH));
  });

  it('accepts a URL it just signed', () => {
    const signer = signerAt(nowMs);
    const url = new URL(signer.sign(PATH));
    expect(signer.verify(PATH, url.searchParams.get('exp') ?? '', url.searchParams.get('sig') ?? '')).toBe(true);
  });

  it('rejects an altered signature, another path, and an expired URL', () => {
    const signer = signerAt(nowMs);
    const url = new URL(signer.sign(PATH));
    const exp = url.searchParams.get('exp') ?? '';
    const sig = url.searchParams.get('sig') ?? '';
    expect(signer.verify(PATH, exp, `${sig.slice(0, -1)}0`)).toBe(false);
    expect(signer.verify('clients/avatars/client-2/photo.jpg', exp, sig)).toBe(false);
    const later = signerAt(nowMs + 3_700_000);
    expect(later.verify(PATH, exp, sig)).toBe(false);
  });

  it('rejects path traversal and prefixes outside clients or chat', () => {
    const signer = signerAt(nowMs);
    expect(() => signer.sign('clients/../chat/other/file.jpg')).toThrow('Invalid storage path');
    expect(signer.verify('clients/../chat/other/file.jpg', '1700003700', 'ab')).toBe(false);
    expect(signer.verify('library/images/coach/photo.jpg', '1700003700', 'ab')).toBe(false);
    expect(() => signer.sign('library/images/coach/photo.jpg')).toThrow('Invalid private storage path');
  });

  it('rounds expiry to the end of the current window', () => {
    expect(privateMediaExpiry(1_700_000_100_000, 3600)).toBe(Math.floor(1_700_000_100 / 3600) * 3600 + 3600);
  });

  it('requires the signing secret in production when Supabase is configured', () => {
    expect(() =>
      PrivateMediaUrlSigner.fromEnv({
        NODE_ENV: 'production',
        SUPABASE_SERVICE_ROLE_KEY: 'key',
        SUPABASE_STORAGE_BUCKET: 'trainerpro-prod',
        SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toThrow('MEDIA_URL_SIGNING_SECRET');
  });
});
