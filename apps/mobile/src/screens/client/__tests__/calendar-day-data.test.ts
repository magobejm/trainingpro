import {
  buildMonthGrid,
  dayChips,
  mergeDayData,
  todayAttentionCount,
  weekDayLabel,
  type DayData,
} from '../client-calendar.helpers';
import { callTimeOptions } from '../calendar-fixed-colors';
import type { ClientCalendarEvent } from '../../../data/hooks/useClientCalendar';

function event(partial: Partial<ClientCalendarEvent>): ClientCalendarEvent {
  return {
    color: null,
    content: null,
    date: '2026-10-20',
    id: 'event-1',
    planDayId: null,
    planDayTitle: undefined,
    time: null,
    title: null,
    type: 'workout',
    ...partial,
  };
}

describe('mergeDayData', () => {
  it('keeps the workout color, the coach notes, the call and the client note', () => {
    const map = mergeDayData(
      [
        event({ color: '#dbeafe', type: 'workout' }),
        event({ content: 'Descansa bien', id: 'note-1', type: 'note' }),
        event({ id: 'call-1', time: '17:15', type: 'call' }),
        event({ content: 'Molestia en la rodilla', id: 'mine-1', type: 'client_note' }),
      ],
      [],
    );
    const day = map.get('2026-10-20');
    expect(day?.workoutColor).toBe('#dbeafe');
    expect(day?.coachNotes).toEqual(['Descansa bien']);
    expect(day?.call).toEqual({
      initiatedBy: null,
      lastProposedBy: null,
      proposalId: null,
      status: 'accepted',
      time: '17:15',
    });
    expect(day?.scheduledCall?.time).toBe('17:15');
    expect(day?.clientNote).toBe('Molestia en la rodilla');
  });

  it('does not treat a coach note or a client note as a meeting', () => {
    const map = mergeDayData([event({ type: 'note' }), event({ id: 'mine', type: 'client_note' })], []);
    expect(map.get('2026-10-20')?.hasMeeting).toBe(false);
  });
});

describe('buildMonthGrid', () => {
  it('keeps the local day number even east of UTC', () => {
    const october = buildMonthGrid(new Date(2026, 9, 1));
    const day21 = october.find((cell) => cell.date.getDate() === 21 && cell.isCurrentMonth);
    expect(day21?.dateStr).toBe('2026-10-21');
  });
});

describe('dayChips', () => {
  const base: DayData = {
    call: null,
    clientNote: null,
    coachNotes: [],
    hasCompleted: false,
    hasMeeting: false,
    hasPlanned: false,
    mood: null,
    originDate: null,
    physicalTest: null,
    planDayId: null,
    planDayTitle: null,
    sessionId: null,
    sessionStatus: null,
    shift: null,
    scheduledCall: null,
    workoutColor: null,
    workouts: [],
  };

  it('stacks a test, the workout, a call and notes, and skips what is missing', () => {
    expect(
      dayChips({
        ...base,
        call: { initiatedBy: null, lastProposedBy: null, proposalId: null, status: 'accepted', time: '18:00' },
        coachNotes: ['Hidratación'],
        hasPlanned: true,
        physicalTest: { done: false, name: 'Cooper', scheduleId: 's1' },
        planDayTitle: 'Pull',
        workouts: [
          {
            color: null,
            done: false,
            originDate: null,
            outcome: 'pending',
            planDayId: null,
            sessionId: null,
            shift: null,
            skipReason: null,
            title: 'Pull',
          },
        ],
      }).map((chip) => chip.kind),
    ).toEqual(['test', 'workout', 'call', 'notes']);
  });

  it('shows a rest day when there is no workout', () => {
    expect(dayChips({ ...base, clientNote: 'Bien' }).map((chip) => chip.kind)).toEqual(['rest', 'notes']);
    expect(dayChips(undefined).map((chip) => chip.kind)).toEqual(['rest']);
  });

  it('keeps a skipped workout undone and an incomplete one reviewable', () => {
    const skipped = mergeDayData(
      [
        event({
          outcome: 'skipped',
          planDayId: 'day-1',
          planDayTitle: 'Pierna',
          sessionId: 'session-1',
          skipReason: 'viaje',
        }),
      ],
      [],
    ).get('2026-10-20')?.workouts[0];
    const incomplete = mergeDayData(
      [event({ outcome: 'incomplete', planDayId: 'day-2', planDayTitle: 'Empuje', sessionId: 'session-2' })],
      [],
    ).get('2026-10-20')?.workouts[0];
    expect(skipped).toMatchObject({ done: false, outcome: 'skipped', sessionId: 'session-1', skipReason: 'viaje' });
    expect(incomplete).toMatchObject({ done: false, outcome: 'incomplete', sessionId: 'session-2' });
    expect(mergeDayData([event({ isCompleted: true, planDayId: 'day-3' })], []).get('2026-10-20')?.hasCompleted).toBe(true);
  });

  it('shows the planned workout name before the session is logged', () => {
    const map = mergeDayData([event({ planDayId: 'day-1', planDayTitle: 'Pierna', title: 'Pierna' })], []);
    const chips = dayChips(map.get('2026-10-20'));
    expect(chips.map((chip) => chip.text)).toEqual(['Pierna']);
    expect(chips[0]?.kind).toBe('workout');
  });

  it('shows two workouts on the same day and a more chip after that', () => {
    const map = mergeDayData(
      [
        event({ id: 'one', planDayId: 'day-1', planDayTitle: 'Pierna' }),
        event({ id: 'two', planDayId: 'day-2', planDayTitle: 'Empuje' }),
        event({ id: 'three', planDayId: 'day-3', planDayTitle: 'Tirón' }),
      ],
      [],
    );
    const chips = dayChips(map.get('2026-10-20'));
    expect(chips.map((chip) => chip.text)).toEqual(['Pierna', 'Empuje', '']);
    expect(chips[2]?.extra).toBe(1);
  });
});

describe('week notes and calls', () => {
  it('keeps a pending call ahead of an accepted one and labels the week day', () => {
    const map = mergeDayData(
      [
        event({ id: 'accepted', time: '09:00', type: 'call' }),
        event({
          callStatus: 'pending',
          id: 'proposal-1',
          initiatedBy: 'COACH',
          lastProposedBy: 'COACH',
          proposalId: 'proposal-1',
          time: '17:15',
          type: 'call',
        }),
        event({ content: 'Descansa', id: 'note-1', type: 'note' }),
      ],
      [],
    );
    const day = map.get('2026-10-20');
    expect(day?.call?.status).toBe('pending');
    expect(day?.call?.proposalId).toBe('proposal-1');
    expect(day?.scheduledCall?.time).toBe('09:00');
    expect(weekDayLabel(day, 'Descanso', 'Nota')).toBe('Descanso · Nota · 09:00 · 17:15');
  });

  it('counts only today and includes a scheduled call', () => {
    const events = [
      event({ content: 'Mia', date: '2026-10-13', id: 'mine', type: 'client_note' }),
      event({ content: 'Suya', date: '2026-10-13', id: 'coach', type: 'note' }),
      event({
        callStatus: 'pending',
        date: '2026-10-13',
        id: 'proposal-2',
        initiatedBy: 'COACH',
        lastProposedBy: 'COACH',
        proposalId: 'proposal-2',
        time: '09:00',
        type: 'call',
      }),
      event({ callStatus: 'accepted', date: '2026-10-13', id: 'accepted', time: '10:00', type: 'call' }),
      event({ content: 'Viernes', date: '2026-10-16', id: 'later-note', type: 'note' }),
      event({ date: '2026-10-18', id: 'later-call', time: '10:00', type: 'call' }),
    ];
    expect(todayAttentionCount(events, new Date(2026, 9, 13))).toBe(4);
    expect(todayAttentionCount(events, new Date(2026, 9, 16))).toBe(1);
    expect(todayAttentionCount(events, new Date(2026, 9, 14))).toBe(0);
  });
});

describe('callTimeOptions', () => {
  it('lists quarter hours from 08:00 to 21:45', () => {
    const options = callTimeOptions();
    expect(options[0]).toBe('08:00');
    expect(options.at(-1)).toBe('21:45');
    expect(options).toContain('17:15');
    expect(options).not.toContain('09:10');
  });
});

it('keeps the original date of a moved incomplete workout', () => {
  const day = mergeDayData([event({ outcome: 'incomplete', date: '2026-10-20', originDate: '2026-10-19' })], []).get(
    '2026-10-20',
  );
  expect(day?.workouts[0]).toMatchObject({ outcome: 'incomplete', originDate: '2026-10-19', shift: 'late' });
});

it('keeps the winning result and its session together independent of event order', () => {
  const complete = event({ id: 'event-a', planDayId: 'plan-a', outcome: 'done', sessionId: 'session-a' });
  const pending = event({ id: 'event-b', planDayId: 'plan-a', outcome: 'pending', sessionId: 'session-b' });
  for (const events of [
    [complete, pending],
    [pending, complete],
  ]) {
    expect(mergeDayData(events, []).get('2026-10-20')?.workouts).toMatchObject([
      { outcome: 'done', sessionId: 'session-a' },
    ]);
  }
});

it('uses the server canonical session while retaining a newer local result for that same session', () => {
  const session = (id: string, status: 'COMPLETED' | 'IN_PROGRESS') => ({
    id,
    sessionDate: '2026-10-20',
    status,
    isCompleted: status === 'COMPLETED',
    isIncomplete: false,
    planDayId: 'plan-a',
    planDayIndex: 1,
    planDayTitle: 'Pierna',
    preMotivation: null,
    postMood: null,
    postFatigue: null,
    postPain: null,
  });
  const result = mergeDayData(
    [event({ planDayId: 'plan-a', sessionId: 'a', outcome: 'done' })],
    [session('z', 'COMPLETED'), session('a', 'COMPLETED')],
  );
  expect(result.get('2026-10-20')?.workouts).toMatchObject([{ sessionId: 'a', outcome: 'done' }]);
  const offline = mergeDayData(
    [event({ planDayId: 'plan-a', sessionId: 'a', outcome: 'pending' })],
    [session('a', 'IN_PROGRESS')],
  );
  expect(offline.get('2026-10-20')?.workouts).toMatchObject([{ sessionId: 'a', outcome: 'in_progress' }]);
});
