import type { SessionItem } from '../../../data/hooks/useTodaySession';
import { reconcileSetDrafts } from '../active-exercise.draft';
import { loggedDraft } from '../active-exercise.save';

const previous = { id: 'exercise', type: 'strength', setsPlanned: 3, logs: [] } as unknown as SessionItem;

it('keeps another series being edited when a saved series refreshes the session', () => {
  const drafts = { 1: { ...loggedDraft(previous, 1), reps: '8' }, 2: { ...loggedDraft(previous, 2), weight: '25' } };
  const refreshed = {
    ...previous,
    logs: [
      { setIndex: 1, repsDone: 8 },
      { setIndex: 3, repsDone: 10 },
    ],
  } as SessionItem;
  const next = reconcileSetDrafts(previous, refreshed, drafts);
  expect(next[1]?.reps).toBe('8');
  expect(next[2]?.weight).toBe('25');
  expect(next[3]?.reps).toBe('10');
});

it('keeps an unsaved removal while another series refreshes', () => {
  const logged = { ...previous, logs: [{ setIndex: 2, repsDone: 8 }] } as SessionItem;
  const drafts = { 2: { ...loggedDraft(logged, 2), reps: '' } };
  expect(reconcileSetDrafts(logged, { ...logged }, drafts)[2]?.reps).toBe('');
});

it('does not carry edited values to a different exercise', () => {
  const drafts = { 1: { ...loggedDraft(previous, 1), reps: '8' } };
  expect(reconcileSetDrafts(previous, { ...previous, id: 'another' }, drafts)[1]?.reps).toBe('');
});
