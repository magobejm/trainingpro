import { workoutShift, type WorkoutShift } from '@trainerpro/shared';
import type { ClientCalendarEvent, ClientSessionSummary } from '../../data/hooks/useClientCalendar';

export type DayWorkout = {
  color: string | null;
  done: boolean;
  originDate: string | null;
  planDayId: string | null;
  sessionId: string | null;
  shift: WorkoutShift | null;
  title: string;
};

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
  planDayId: string | null;
  physicalTest: { done: boolean; name: string; scheduleId: string } | null;
  workouts: DayWorkout[];
};

export type DayChipKind = 'call' | 'notes' | 'rest' | 'test' | 'workout';

export type DayChip = {
  color?: string | null;
  extra?: number;
  kind: DayChipKind;
  text: string;
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
  const get = (key: string): DayData => map.get(key) ?? emptyDay();

  for (const session of sessions) {
    const day = get(session.sessionDate);
    day.mood = session.postMood;
    day.sessionStatus = session.status;
    addWorkout(day, workoutFromSession(session));
    map.set(session.sessionDate, day);
  }

  for (const event of events) {
    const dateStr = event.date.slice(0, 10);
    const day = get(dateStr);
    applyEvent(day, event, dateStr);
    map.set(dateStr, day);
  }

  return map;
}

/** Orden fijo: test, entrenos o descanso, llamada y notas. Lo que no existe no sale. */
export function dayChips(data: DayData | undefined): DayChip[] {
  const chips: DayChip[] = [];
  if (data?.physicalTest) chips.push({ kind: 'test', text: data.physicalTest.name });
  chips.push(...workoutChips(data));
  if (data?.call || data?.hasMeeting) chips.push({ kind: 'call', text: data.call?.time ?? '' });
  if ((data?.coachNotes.length ?? 0) > 0 || data?.clientNote) chips.push({ kind: 'notes', text: '' });
  return chips;
}

export const MOOD_EMOJI: Record<number, string> = {
  1: '😫',
  2: '😟',
  3: '😐',
  4: '🙂',
  5: '😄',
};

function emptyDay(): DayData {
  return {
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
    workouts: [],
  };
}

function workoutFromSession(session: ClientSessionSummary): DayWorkout {
  return {
    color: null,
    done: session.isCompleted,
    originDate: null,
    planDayId: session.planDayId,
    sessionId: session.id,
    shift: null,
    title: session.planDayTitle ?? '',
  };
}

function applyEvent(day: DayData, event: ClientCalendarEvent, dateStr: string): void {
  if (event.type === 'workout') addWorkout(day, workoutFromEvent(event, dateStr));
  if (event.type === 'physical_test') {
    day.physicalTest = {
      done: Boolean(event.isCompleted),
      name: event.title ?? '',
      scheduleId: event.scheduleId ?? event.id,
    };
  }
  if (event.type === 'note' && event.content) day.coachNotes.push(event.content);
  if (event.type === 'call' && event.time) day.call = { time: event.time };
  if (event.type === 'client_note' && event.content) day.clientNote = event.content;
  if (event.type === 'reminder') day.hasMeeting = true;
}

function workoutFromEvent(event: ClientCalendarEvent, dateStr: string): DayWorkout {
  const shift = event.isCompleted ? workoutShift(dateStr, event.originDate) : null;
  return {
    color: event.color,
    done: Boolean(event.isCompleted),
    originDate: shift ? (event.originDate ?? null) : null,
    planDayId: event.planDayId,
    sessionId: null,
    shift,
    title: (event.planDayTitle ?? event.title ?? '').trim(),
  };
}

function addWorkout(day: DayData, workout: DayWorkout): void {
  const same = day.workouts.find((item) => sameWorkout(item, workout));
  if (same) mergeWorkout(same, workout);
  else day.workouts.push(workout);
  const first = day.workouts[0];
  day.planDayId = first?.planDayId ?? null;
  day.planDayTitle = first?.title || null;
  day.sessionId = day.workouts.find((item) => item.sessionId)?.sessionId ?? null;
  day.hasCompleted = day.workouts.some((item) => item.done);
  day.hasPlanned = day.workouts.some((item) => !item.done);
  day.workoutColor = day.workouts.find((item) => item.color)?.color ?? null;
  const shifted = day.workouts.find((item) => item.shift);
  day.shift = shifted?.shift ?? null;
  day.originDate = shifted?.originDate ?? null;
}

function sameWorkout(item: DayWorkout, workout: DayWorkout): boolean {
  if (workout.planDayId && item.planDayId) return item.planDayId === workout.planDayId;
  return Boolean(workout.title) && item.title === workout.title;
}

function mergeWorkout(item: DayWorkout, workout: DayWorkout): void {
  if (workout.done) item.done = true;
  if (workout.sessionId) item.sessionId = workout.sessionId;
  if (workout.title) item.title = workout.title;
  if (workout.planDayId) item.planDayId = workout.planDayId;
  if (workout.color) item.color = workout.color;
  if (workout.shift) {
    item.shift = workout.shift;
    item.originDate = workout.originDate;
  }
}

function workoutChips(data: DayData | undefined): DayChip[] {
  const workouts = data?.workouts ?? [];
  if (workouts.length === 0) return [{ kind: 'rest', text: '' }];
  const visible: DayChip[] = workouts.slice(0, 2).map((workout) => ({
    color: workout.color,
    kind: 'workout',
    text: workout.title,
  }));
  if (workouts.length > 2) visible.push({ extra: workouts.length - 2, kind: 'workout', text: '' });
  return visible;
}
