import { workoutShift, type WorkoutShift } from '@trainerpro/shared';
import type { ClientCalendarEvent, ClientSessionSummary } from '../../data/hooks/useClientCalendar';

export type DayData = {
  hasCompleted: boolean;
  hasPlanned: boolean;
  hasMeeting: boolean;
  sessionId: string | null;
  sessionStatus: string | null;
  mood: number | null;
  originDate: string | null;
  planDayTitle: string | null;
  shift: WorkoutShift | null;
  workoutColor: string | null;
  coachNotes: string[];
  call: { time: string } | null;
  clientNote: string | null;
};

export type GridCell = {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
};

export function toDateStr(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function buildMonthGrid(month: Date): GridCell[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(1 - startOffset);
  const cells: GridCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: d.getMonth() === m });
  }
  const last7 = cells.slice(35);
  if (!last7.some((c) => c.isCurrentMonth)) return cells.slice(0, 35);
  return cells;
}

export function mergeDayData(events: ClientCalendarEvent[], sessions: ClientSessionSummary[]): Map<string, DayData> {
  const map = new Map<string, DayData>();
  const get = (k: string): DayData =>
    map.get(k) ?? {
      hasCompleted: false,
      hasPlanned: false,
      hasMeeting: false,
      sessionId: null,
      sessionStatus: null,
      mood: null,
      originDate: null,
      planDayTitle: null,
      shift: null,
      workoutColor: null,
      coachNotes: [],
      call: null,
      clientNote: null,
    };

  for (const s of sessions) {
    const d = get(s.sessionDate);
    d.sessionId = s.id;
    d.sessionStatus = s.status;
    d.hasCompleted = s.isCompleted;
    d.hasPlanned = !s.isCompleted;
    d.mood = s.postMood;
    d.planDayTitle = s.planDayTitle;
    map.set(s.sessionDate, d);
  }

  for (const e of events) {
    const dateStr = e.date.slice(0, 10);
    const d = get(dateStr);
    if (e.type === 'workout' && !d.sessionId) d.hasPlanned = true;
    if (e.type === 'workout' && e.isCompleted) {
      const shift = workoutShift(dateStr, e.originDate);
      if (shift) {
        d.originDate = e.originDate ?? null;
        d.shift = shift;
      }
    }
    if (e.type === 'workout' && e.color) d.workoutColor = e.color;
    if (e.type === 'note' && e.content) d.coachNotes.push(e.content);
    if (e.type === 'call' && e.time) d.call = { time: e.time };
    if (e.type === 'client_note' && e.content) d.clientNote = e.content;
    if (e.type === 'reminder') d.hasMeeting = true;
    map.set(dateStr, d);
  }

  return map;
}

export const MOOD_EMOJI: Record<number, string> = {
  1: '😫',
  2: '😟',
  3: '😐',
  4: '🙂',
  5: '😄',
};
