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

it('keeps sport distance in canonical metres across pending-op replay', () => {
  const session = sampleSession();
  session.items = [{ id: 'sport-1', type: 'sport', setLogs: [] }] as never;
  const draft = upsertOp(createSessionDraft(session), {
    kind: 'sport-set',
    path: '/sessions/session-1/sport-blocks/sport-1/sets',
    dedupeKey: 'sport-set:sport-1:1',
    body: { sessionSportBlockId: 'sport-1', setIndex: 1, distanceDoneMeters: 1250, durationSecondsDone: 150 },
  });
  const view = applyPendingOps(session, draft.ops);
  expect(view.items[0]).toMatchObject({ setLogs: [{ distanceDoneMeters: 1250, durationSecondsDone: 150 }] });
  expect(applyPendingOps(view, draft.ops)).toEqual(view);
});

it('recomputes the result when replaying start and incomplete finish with stale metadata', () => {
  const session = { ...sampleSession(), outcome: 'pending' as const, originDate: '2026-10-18', sessionDate: '2026-10-19' };
  const start = upsertOp(createSessionDraft(session), {
    kind: 'start',
    path: '/sessions/session-1/start',
    dedupeKey: 'start',
    body: {},
  });
  expect(applyPendingOps(session, start.ops).outcome).toBe('in_progress');
  const finish = upsertOp(start, {
    kind: 'finish',
    path: '/sessions/session-1/finish',
    dedupeKey: 'finish',
    body: { isIncomplete: true },
  });
  const view = applyPendingOps(session, finish.ops);
  expect(view).toMatchObject({ outcome: 'incomplete', originDate: '2026-10-18', sessionDate: '2026-10-19' });
  expect(applyPendingOps(view, []).outcome).toBe('incomplete');
});
