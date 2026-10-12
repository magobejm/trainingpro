import type { KvBackend } from '../../chunked-storage';
import { createSessionDraft, readSessionDraft, upsertOp, writeSessionDraft, type SessionOpInput } from '../session-draft';
import { sampleSession } from './sample-session';

describe('session draft', () => {
  it('reads the same draft after a restart', async () => {
    const backend = memoryKv();
    let draft = createSessionDraft(sampleSession());
    for (let index = 1; index <= 40; index += 1) {
      const input: SessionOpInput = {
        body: { repsDone: index, sessionItemId: 'item-1', setIndex: index },
        dedupeKey: `log-set:item-1:${index}`,
        kind: 'log-set',
        path: '/sessions/session-1/log-set',
      };
      draft = upsertOp(draft, input);
    }
    await writeSessionDraft(draft, backend);
    const restored = await readSessionDraft(draft.sessionId, backend);
    expect(restored).toEqual(draft);
  });
});

function memoryKv(): KvBackend {
  const items = new Map<string, string>();
  return {
    getItem: async (key) => items.get(key) ?? null,
    removeItem: async (key) => {
      items.delete(key);
    },
    setItem: async (key, value) => {
      items.set(key, value);
    },
  };
}
