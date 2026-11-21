import { countClientsWithOpenIncidents } from '../coach-triage-model';
import { filterTimelineItems, groupTimelineByDay } from '../coach-timeline-model';
import { clientFitnessLevelValues, clientSexValues } from '../../../screens/coach/coach-client-model';

it('counts clients, not incidents, with open incidents', () => {
  expect(
    countClientsWithOpenIncidents([
      { clientId: 'a', status: 'OPEN' },
      { clientId: 'a', status: 'OPEN' },
      { clientId: 'b', status: 'OPEN' },
      { clientId: 'c', status: 'REVIEWED' },
    ]),
  ).toBe(2);
  expect(countClientsWithOpenIncidents([])).toBe(0);
});

it('groups timeline items by local day', () => {
  const item = (id: string, occurredAt: string) =>
    ({ id, occurredAt, kind: 'note', title: id, detail: null, refId: id }) as never;
  const groups = groupTimelineByDay([
    item('1', '2026-11-20T10:00:00'),
    item('2', '2026-11-20T08:00:00'),
    item('3', '2026-11-19T22:00:00'),
  ]);
  expect(groups.map((g) => g.items.length)).toEqual([2, 1]);
});

it('filters the timeline by kind', () => {
  const item = (id: string, kind: string) => ({
    id,
    occurredAt: '2026-11-20T10:00:00',
    kind,
    title: id,
    detail: null,
    refId: id,
  });
  const items = [item('1', 'session'), item('2', 'chat')] as never;
  expect(filterTimelineItems(items, 'all')).toHaveLength(2);
  expect(filterTimelineItems(items, 'chat').map((entry) => entry.id)).toEqual(['2']);
});

it('offers the sex and fitness level options of the web', () => {
  expect([...clientSexValues]).toEqual(['', 'male', 'female', 'other']);
  expect([...clientFitnessLevelValues]).toEqual(['', 'beginner', 'intermediate', 'advanced', 'elite']);
});
