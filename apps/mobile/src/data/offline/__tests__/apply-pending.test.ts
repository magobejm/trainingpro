import { applyPendingOps } from '../apply-pending';
import { createSessionDraft, upsertOp } from '../session-draft';
import { sampleSession } from './sample-session';

describe('apply pending ops', () => {
  it('shows a pending set on top of the server session', () => {
    const draft = upsertOp(createSessionDraft(sampleSession()), {
      body: { effortRpe: 8, repsDone: 8, sessionItemId: 'item-1', setIndex: 1, weightDoneKg: 50 },
      dedupeKey: 'log-set:item-1:1',
      kind: 'log-set',
      path: '/sessions/session-1/log-set',
    });
    const session = sampleSession();
    const view = applyPendingOps(session, draft.ops);
    const item = view.items[0];
    expect(item?.type).toBe('strength');
    if (item?.type !== 'strength') return;
    expect(item.logs).toEqual([
      {
        effortRir: null,
        effortRpe: 8,
        repsDone: 8,
        restSecondsDone: null,
        sessionItemId: 'item-1',
        setIndex: 1,
        weightDoneKg: 50,
      },
    ]);
    expect(session.items[0]).toMatchObject({ type: 'strength', logs: [] });
  });
});
