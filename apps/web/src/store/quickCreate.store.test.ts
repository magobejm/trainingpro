import { describe, expect, it } from 'vitest';
import { useQuickCreateStore } from './quickCreate.store';

describe('quickCreate.store', () => {
  it('consume devuelve la intención una sola vez', () => {
    useQuickCreateStore.getState().request('note');
    expect(useQuickCreateStore.getState().consume()).toBe('note');
    expect(useQuickCreateStore.getState().consume()).toBeNull();
  });
});
