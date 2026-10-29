import { refreshSessionAfterSave } from '../../../data/offline/session-refresh';
import type { SessionItem } from '../../../data/hooks/useTodaySession';
import {
  claimSetSave,
  dirtySetIndexes,
  loggedDraft,
  outcomeFromEnqueue,
  saveButtonKey,
  saveButtonPhase,
  saveErrorKey,
  saveNoticeKey,
  setDraftMatchesLogged,
} from '../active-exercise.save';
import type { SetRowState } from '../active-exercise.helpers';

const logged = {
  id: 'item-1',
  lockedFields: [],
  logs: [{ effortRir: 2, effortRpe: 7, repsDone: 8, setIndex: 1, weightDoneKg: 20.5 }],
  type: 'strength',
} as unknown as SessionItem;

function row(overrides: Partial<SetRowState> = {}): SetRowState {
  return { ...loggedDraft(logged, 1), ...overrides };
}

describe('set save decisions', () => {
  it('treats the same numbers as already saved, including a comma decimal', () => {
    expect(setDraftMatchesLogged(logged, 1, row())).toBe(true);
    expect(setDraftMatchesLogged(logged, 1, row({ weight: '20,5' }))).toBe(true);
    expect(setDraftMatchesLogged(logged, 1, row({ reps: '9' }))).toBe(false);
  });

  it('finishes an exercise by sending only the sets that changed', () => {
    const drafts = {
      1: row(),
      2: row({ reps: '6', rir: '', rpe: '', weight: '' }),
      3: row({ reps: '', rir: '', rpe: '', weight: '' }),
    };

    expect(dirtySetIndexes(logged, drafts, 3)).toEqual([2]);
    expect(dirtySetIndexes(logged, { 1: row({ reps: '', rir: '', rpe: '', weight: '' }) }, 1)).toEqual([1]);
  });

  it('ignores a second tap while the set is already saving', () => {
    const inFlight = new Set<number>();
    expect(claimSetSave(inFlight, 1)).toBe(true);
    expect(claimSetSave(inFlight, 1)).toBe(false);
    expect(claimSetSave(inFlight, 2)).toBe(true);
  });

  it('announces a saved set once and keeps the offline message', () => {
    expect(saveNoticeKey(['synced', 'skipped'])).toBe('mobile.client.session.setSaved');
    expect(saveNoticeKey(['pending', 'synced'])).toBe('mobile.client.sync.savedOffline');
    expect(saveNoticeKey(['skipped'])).toBeNull();
    expect(saveNoticeKey(['synced', 'failed'])).toBeNull();
  });

  it('counts the set as saved when the post is accepted and the session refresh fails', async () => {
    const outcome = outcomeFromEnqueue('synced');
    const invalidateQueries = jest.fn(() => Promise.reject(new Error('refresh')));

    expect(outcome).toBe('synced');
    expect(saveButtonPhase({ busy: false, clean: true, failed: false })).toBe('saved');
    expect(saveButtonKey('saved')).toBe('mobile.client.session.setSaved');
    expect(saveNoticeKey([outcome])).toBe('mobile.client.session.setSaved');
    refreshSessionAfterSave({ invalidateQueries }, 'session-1');
    await Promise.resolve();
    await Promise.resolve();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['session', 'session-1'] });
  });

  it('leaves the save button ready and reports an error when the post is rejected', () => {
    const outcome = outcomeFromEnqueue('conflict');

    expect(outcome).toBe('failed');
    expect(saveErrorKey(outcome)).toBe('mobile.client.session.saveSetError');
    expect(saveButtonPhase({ busy: true, clean: true, failed: false })).toBe('saving');
    expect(saveButtonKey('saving')).toBe('mobile.client.session.savingSet');
    expect(saveButtonPhase({ busy: false, clean: true, failed: true })).toBe('idle');
    expect(saveButtonKey('idle')).toBe('mobile.client.session.saveSet');
    expect(saveNoticeKey([outcome])).toBeNull();
  });
});
