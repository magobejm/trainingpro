import { describe, expect, it } from 'vitest';
import type { ClientTimelineItem } from '@trainerpro/shared';
import {
  describeTimelineItem,
  filterTimelineItems,
  formatEventTime,
  groupTimeline,
  lastEventLine,
  timelineKindTone,
} from './timeline.helpers';

const t = (key: string, options?: Record<string, number | string>): string => {
  if (options) return `${key}:${Object.values(options).join(',')}`;
  return key;
};

function item(overrides: Partial<ClientTimelineItem>): ClientTimelineItem {
  return {
    detail: null,
    id: overrides.id ?? '1',
    kind: 'note',
    occurredAt: '2026-10-22T18:30:00.000Z',
    refId: 'ref',
    title: 'Nota',
    ...overrides,
  };
}

describe('timeline helpers', () => {
  it('groups events by day and starts a new month label when the month changes', () => {
    const groups = groupTimeline(
      [
        item({ id: 'a', occurredAt: '2026-10-22T10:00:00.000Z', sessionDate: '2026-10-22' }),
        item({ id: 'b', occurredAt: '2026-10-22T09:00:00.000Z', sessionDate: '2026-10-22' }),
        item({ id: 'c', kind: 'chat', occurredAt: '2026-09-30T09:00:00.000Z' }),
      ],
      '2026-10-23',
      t,
      'es',
    );
    expect(groups.map((group) => group.dayKey)).toEqual(['2026-10-22', '2026-09-30']);
    expect(groups[0]?.dayLabel).toBe('coach.timeline.yesterday');
    expect(groups[0]?.items).toHaveLength(2);
    expect(groups[0]?.monthLabel?.toLocaleLowerCase('es')).toContain('octubre');
    expect(groups[1]?.monthLabel?.toLocaleLowerCase('es')).toContain('septiembre');
  });

  it('labels today and keeps a named weekday for older days', () => {
    const groups = groupTimeline([item({ occurredAt: '2026-10-14T08:00:00.000Z' })], '2026-10-14', t, 'es');
    expect(groups[0]?.dayLabel).toBe('coach.timeline.today');
    const older = groupTimeline(
      [item({ sessionDate: '2026-10-14', occurredAt: '2026-10-14T08:00:00.000Z' })],
      '2026-10-23',
      t,
      'es',
    );
    expect(older[0]?.dayLabel.toLocaleLowerCase('es')).toContain('miércoles');
    expect(older[0]?.dayLabel).toContain('14');
  });

  it('filters by kind and describes a session with its outcome and origin', () => {
    const session = item({
      id: 's',
      kind: 'session',
      originDate: '2026-10-13',
      outcome: 'incomplete',
      skipReason: null,
      title: 'Día 1',
    });
    expect(filterTimelineItems([session, item({ id: 'n' })], 'session')).toEqual([session]);
    const card = describeTimelineItem(session, t, 'es');
    expect(card.title).toBe('Día 1');
    expect(card.badge).toBe('training.outcome.incomplete');
    expect(card.badgeTone).toBe('warning');
    expect(card.detail.startsWith('coach.timeline.origin:')).toBe(true);
    expect(card.detail).toContain('13');
    expect(timelineKindTone('session')).toBe('warning');
    expect(timelineKindTone('photo')).toBe('muted');
  });

  it('describes chat, reviewed incidents and event time', () => {
    const chat = describeTimelineItem(item({ detail: '3', kind: 'chat', title: '' }), t, 'es');
    expect(chat.title).toBe('coach.timeline.messages:3');
    expect(chat.detail).toBe('');
    const incident = describeTimelineItem(item({ detail: 'reviewed', kind: 'incident', title: 'Rodilla' }), t, 'es');
    expect(incident.detail).toBe('coach.timeline.reviewed');
    const iso = '2026-10-22T18:30:00.000Z';
    expect(formatEventTime('2026-10-22', 'es')).toBe('');
    expect(formatEventTime(iso, 'es')).toBe(new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }));
  });

  it('summarizes the latest event for the profile row', () => {
    const line = lastEventLine(
      item({ kind: 'session', outcome: 'done', sessionDate: '2026-10-23', title: 'Día 1' }),
      t,
      '2026-10-23',
      'es',
    );
    expect(line).toBe('coach.timeline.last:coach.timeline.kind.session Día 1 · training.outcome.done,coach.timeline.today');
  });
});
