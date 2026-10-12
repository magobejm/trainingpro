import { ApiClientError } from '../../api-client';
import { createSessionDraft, upsertOp, type SessionDraft, type SessionOpInput } from '../session-draft';
import { flushQueue, type SessionTransport } from '../session-queue';
import { sampleSession } from './sample-session';

describe('session queue', () => {
  it('sends one write per set after the network returns, using the latest value', async () => {
    let draft = createSessionDraft(sampleSession());
    draft = upsertOp(draft, logInput(5));
    draft = upsertOp(draft, logInput(8));
    expect(draft.ops).toHaveLength(1);

    const seen: unknown[] = [];
    let online = false;
    const transport: SessionTransport = {
      post: async (_path, body) => {
        if (!online) throw new Error('offline');
        seen.push(body);
        return {};
      },
    };

    const pending = await flushQueue(transport, draft);
    expect(pending.ops).toHaveLength(1);
    online = true;
    const done = await flushQueue(transport, pending);
    expect(done.ops).toHaveLength(0);
    expect(seen).toEqual([logInput(8).body]);
  });

  it('sends start, then sets, then finish', async () => {
    const paths: string[] = [];
    const draft = withOps(createSessionDraft(sampleSession()), [
      { body: { preFatigue: 3 }, dedupeKey: 'start', kind: 'start', path: '/sessions/session-1/start' },
      logInput(8),
      {
        body: { isIncomplete: false, sessionRpe: 7 },
        dedupeKey: 'finish',
        kind: 'finish',
        path: '/sessions/session-1/finish',
      },
    ]);
    await flushQueue(
      {
        post: async (path) => {
          paths.push(path);
          return {};
        },
      },
      draft,
    );
    expect(paths).toEqual(['/sessions/session-1/start', '/sessions/session-1/log-set', '/sessions/session-1/finish']);
  });

  it('moves rejected writes to conflicts and keeps going', async () => {
    const statuses = [400, 403, 403, 404, 409];
    const messages = [
      'Session already completed',
      'Session edit window has expired',
      'Session access denied',
      'Session item not found',
      'Session finish conflict',
    ];
    let call = 0;
    const draft = withOps(
      createSessionDraft(sampleSession()),
      [0, 1, 2, 3, 4, 5].map((index) => logInput(index + 1, `log-set:item-1:${index + 1}`)),
    );
    const done = await flushQueue(
      {
        post: async () => {
          const current = call;
          call += 1;
          if (current < statuses.length) {
            throw new ApiClientError(messages[current] ?? 'error', statuses[current] ?? 400);
          }
          return {};
        },
      },
      draft,
    );
    expect(done.ops).toHaveLength(0);
    expect(done.conflicts.map((conflict) => conflict.reason)).toEqual([
      'completed',
      'window',
      'access',
      'removed',
      'finish',
    ]);
    expect(call).toBe(6);
  });

  it('keeps the queue when the response is 401 or 500', async () => {
    await expect(stopStatus(401)).resolves.toBe(2);
    await expect(stopStatus(500)).resolves.toBe(2);
  });
});

function logInput(repsDone: number, dedupeKey = 'log-set:item-1:1'): SessionOpInput {
  return {
    body: { repsDone, sessionItemId: 'item-1', setIndex: Number(dedupeKey.split(':')[2]) },
    dedupeKey,
    kind: 'log-set',
    path: '/sessions/session-1/log-set',
  };
}

function withOps(draft: SessionDraft, inputs: SessionOpInput[]): SessionDraft {
  return inputs.reduce((current, input) => upsertOp(current, input), draft);
}

async function stopStatus(status: number): Promise<number> {
  const draft = withOps(createSessionDraft(sampleSession()), [
    logInput(5, 'log-set:item-1:1'),
    logInput(6, 'log-set:item-1:2'),
  ]);
  let calls = 0;
  const stopped = await flushQueue(
    {
      post: async () => {
        calls += 1;
        throw new ApiClientError('no', status);
      },
    },
    draft,
  );
  expect(calls).toBe(1);
  return stopped.ops.length;
}
