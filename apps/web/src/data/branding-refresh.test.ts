import { describe, expect, it } from 'vitest';
import { brandingRefreshInterval } from './branding-refresh';

describe('signed branding image refresh', () => {
  it('renews at the signing window boundary instead of polling with an expired URL', () => {
    expect(brandingRefreshInterval('http://localhost/files/logo?exp=60', 50_000)).toBe(11_000);
    expect(brandingRefreshInterval('http://localhost/files/logo?exp=60', 70_000)).toBe(1000);
  });
  it('uses a bounded interval for absent, invalid, or far-future expiry', () => {
    expect(brandingRefreshInterval(null)).toBe(900_000);
    expect(brandingRefreshInterval('not a url')).toBe(900_000);
    expect(brandingRefreshInterval('http://localhost/files/logo?exp=100000', 0)).toBe(900_000);
  });
});
