import { describe, expect, it } from 'vitest';
import {
  clientIdFromSearch,
  contextForClient,
  readListContext,
  restoreListContext,
  searchWithClient,
  writeListContext,
} from './list-context';

describe('list context', () => {
  it('restores search and filter from storage', () => {
    const storage = memoryStorage();
    const initial = { objectiveFilter: 'ALL', searchValue: '' };
    writeListContext('clients', { objectiveFilter: 'strength', searchValue: 'ana' }, storage);
    expect(restoreListContext('clients', initial, storage)).toEqual({
      objectiveFilter: 'strength',
      searchValue: 'ana',
    });
    expect(readListContext('missing', storage)).toBeNull();
  });

  it('does not reuse the context of another client', () => {
    const stored = { clientId: 'client-a', selectedExercise: { id: 'squat' } };
    expect(contextForClient(stored, 'client-a')?.selectedExercise.id).toBe('squat');
    expect(contextForClient(stored, 'client-b')).toBeNull();
    expect(contextForClient(stored, '')).toBeNull();
  });

  it('keeps the client only in the search of the route that opened it', () => {
    expect(searchWithClient('', 'client-a')).toBe('?client=client-a');
    expect(clientIdFromSearch('?client=client-a')).toBe('client-a');
    expect(searchWithClient('?client=client-a&tab=notes', null)).toBe('?tab=notes');
    expect(clientIdFromSearch('?tab=notes')).toBeNull();
  });
});

function memoryStorage(): Pick<Storage, 'getItem' | 'removeItem' | 'setItem'> {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}
