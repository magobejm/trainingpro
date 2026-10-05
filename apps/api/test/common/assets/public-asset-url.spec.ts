import { absolutizeAssetPaths } from '../../../src/common/assets/public-asset-url';

const BASE = 'https://api.example.com';

describe('absolutizeAssetPaths', () => {
  it('prefixes bundled exercise image paths with the public base url', () => {
    expect(absolutizeAssetPaths('/assets/exercises/abc.webp', BASE)).toBe(`${BASE}/assets/exercises/abc.webp`);
  });

  it('rewrites paths nested in objects and arrays', () => {
    const input = {
      items: [{ media: { type: 'image', url: '/assets/exercises/a.webp' } }, { mediaUrl: '/assets/exercises/b.webp' }],
    };
    expect(absolutizeAssetPaths(input, BASE)).toEqual({
      items: [
        { media: { type: 'image', url: `${BASE}/assets/exercises/a.webp` } },
        { mediaUrl: `${BASE}/assets/exercises/b.webp` },
      ],
    });
  });

  it('leaves absolute urls and unrelated strings untouched', () => {
    const input = { a: 'https://cdn.example.com/x.png', b: '/uploads/x.png', c: 'texto', d: 3, e: null };
    expect(absolutizeAssetPaths(input, BASE)).toEqual(input);
  });

  it('trims a trailing slash in the base url', () => {
    expect(absolutizeAssetPaths('/assets/exercises/a.webp', `${BASE}/`)).toBe(`${BASE}/assets/exercises/a.webp`);
  });

  it('keeps Date instances intact', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    expect(absolutizeAssetPaths({ date }, BASE)).toEqual({ date });
  });
});
