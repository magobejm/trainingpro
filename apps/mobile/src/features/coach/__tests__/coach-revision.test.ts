import { coachRevisionMatches, findCoachNote } from '../coach-revision';

describe('coach edit revision checks', () => {
  it('blocks changes and deletion while allowing equal values with reordered object keys', () => {
    expect(coachRevisionMatches({ id: 'a', content: 'old' }, { content: 'old', id: 'a' })).toBe(true);
    expect(coachRevisionMatches({ content: 'old' }, { content: 'web edit' })).toBe(false);
    expect(coachRevisionMatches({ id: 'a' }, undefined)).toBe(false);
  });
  it('finds a note beyond the first page and reports a removed note', async () => {
    const load = jest.fn(async (cursor?: string) =>
      cursor ? { data: [{ id: 'older' }] } : { data: [{ id: 'recent' }], nextCursor: 'page2' },
    );
    expect(await findCoachNote('older', load)).toEqual({ id: 'older' });
    expect(load.mock.calls).toEqual([[undefined], ['page2']]);
    expect(await findCoachNote('deleted', load)).toBeUndefined();
  });
  it('stops a repeated cursor instead of looping indefinitely', async () => {
    await expect(findCoachNote('missing', async () => ({ data: [], nextCursor: 'same' }))).rejects.toThrow('cursor');
  });
});
