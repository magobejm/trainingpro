import { describe, expect, it } from 'vitest';
import { flattenPages, shouldLoadNextPage } from './usePagedList';

describe('usePagedList', () => {
  it('junta las páginas en orden', () => {
    expect(flattenPages([{ items: ['a'] }, { items: ['b'], nextCursor: null }])).toEqual(['a', 'b']);
  });

  it('pide otra página al acercarse al final', () => {
    expect(shouldLoadNextPage({ contentHeight: 1000, offsetY: 800, viewportHeight: 100 })).toBe(true);
    expect(shouldLoadNextPage({ contentHeight: 1000, offsetY: 100, viewportHeight: 100 })).toBe(false);
  });
});
