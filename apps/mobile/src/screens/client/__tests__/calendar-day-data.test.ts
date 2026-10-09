import { buildMonthGrid, dayChips, mergeDayData, type DayData } from '../client-calendar.helpers';
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
    expect(day?.call).toEqual({ time: '17:15' });
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
    workoutColor: null,
  };

  it('stacks a test, the workout, a call and notes, and skips what is missing', () => {
    expect(
      dayChips({
        ...base,
        call: { time: '18:00' },
        coachNotes: ['Hidratación'],
        hasPlanned: true,
        physicalTest: { done: false, name: 'Cooper', scheduleId: 's1' },
        planDayTitle: 'Pull',
      }).map((chip) => chip.kind),
    ).toEqual(['test', 'workout', 'call', 'notes']);
  });

  it('shows a rest day when there is no workout', () => {
    expect(dayChips({ ...base, clientNote: 'Bien' }).map((chip) => chip.kind)).toEqual(['rest', 'notes']);
    expect(dayChips(undefined).map((chip) => chip.kind)).toEqual(['rest']);
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
