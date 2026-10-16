import { coachContextKey, draftConflicts, stableDraftValue } from '../coach-draft-policy';

describe('coach workspace isolation', () => {
  it('isolates drafts by account, role and resource', () => {
    expect(coachContextKey('a', 'coach', 'ficha/Ángela')).toMatch(/^[\w.-]+$/);
    expect(coachContextKey('a', 'coach', 'client/1')).not.toBe(coachContextKey('b', 'coach', 'client/1'));
    expect(coachContextKey('a', 'coach', 'client/1')).not.toBe(coachContextKey('a', 'client', 'client/1'));
    expect(coachContextKey('a', 'coach', 'client/1')).not.toBe(coachContextKey('a', 'coach', 'client/2'));
  });
  it('recognizes reordered object fields without changing an edited baseline', () => {
    expect(stableDraftValue({ b: 2, a: 1 })).toBe(stableDraftValue({ a: 1, b: 2 }));
    expect(draftConflicts('v1', 'v2')).toBe(true);
    expect(draftConflicts('v1', 'v1')).toBe(false);
    expect(draftConflicts(undefined, 'v1')).toBe(false);
  });
});
