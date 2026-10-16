import { coachLibraryQueryPath } from '../coach-library-query';
describe('coach library query routing', () => {
  it.each([
    ['strength', 'muscleGroups'],
    ['cardio', 'cardioMethodTypes'],
    ['isometric', 'isometricTypes'],
    ['plio', 'plioTypes'],
    ['mobility', 'mobilityTypes'],
    ['sport', 'sportTypes'],
  ])('uses actual unified filter for %s', (category, base) => {
    const url = new URL(coachLibraryQueryPath(category, 'sentadilla & salto', 'cursor/1'), 'https://api.local');
    expect(url.pathname).toBe('/library/exercises/all');
    expect(url.searchParams.get('baseCategory')).toBe(base);
    expect(url.searchParams.get('search')).toBe('sentadilla & salto');
    expect(url.searchParams.get('cursor')).toBe('cursor/1');
  });
  it('uses the food search parameter without an exercise category', () => {
    const url = new URL(coachLibraryQueryPath('foods', 'arroz', ''), 'https://api.local');
    expect(url.pathname).toBe('/library/foods');
    expect(url.searchParams.get('query')).toBe('arroz');
    expect(url.searchParams.has('baseCategory')).toBe(false);
  });
});
