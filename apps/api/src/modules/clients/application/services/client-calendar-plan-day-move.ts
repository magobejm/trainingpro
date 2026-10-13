export function originDateAfterMove(planned: Date, performed: Date, previousOrigin: Date | null): Date | null {
  const origin = previousOrigin ?? planned;
  return utcDateKey(origin) === utcDateKey(performed) ? null : origin;
}

export function utcCalendarDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function utcDateKey(date: Date): string {
  return utcCalendarDate(date).toISOString().slice(0, 10);
}

export function pendingSearchRange(sessionDate: Date): { from: Date; to: Date } {
  const from = utcCalendarDate(sessionDate);
  from.setUTCDate(from.getUTCDate() - 28);
  const to = utcCalendarDate(sessionDate);
  to.setUTCDate(to.getUTCDate() + 28);
  return { from, to };
}

export function pickNearestPending<T extends { date: Date }>(
  events: T[],
  todayKey: string,
  isRequested: (event: T) => boolean,
): T | null {
  const candidates = events.filter((event) => utcDateKey(event.date) !== todayKey && isRequested(event));
  const ranked = [...candidates].sort((left, right) => compareNearness(todayKey, left.date, right.date));
  return ranked[0] ?? null;
}

export type WorkoutPlacement = { type: 'create' } | { type: 'move'; sourceId: string } | { type: 'none' };

export function chooseWorkoutPlacement<T extends { date: Date; id: string }>(input: {
  events: T[];
  isPendingRequested: (event: T) => boolean;
  todayKey: string;
}): WorkoutPlacement {
  const pending = input.events.filter(input.isPendingRequested);
  if (pending.some((event) => utcDateKey(event.date) === input.todayKey)) return { type: 'none' };
  const source = pickNearestPending(pending, input.todayKey, () => true);
  if (source) return { type: 'move', sourceId: source.id };
  return { type: 'create' };
}

export function coachMoveMessage(input: { fromDate: Date | null; requestedTitle: string | null }): string {
  const requested = input.requestedTitle ?? 'otro día';
  if (!input.fromDate) {
    return (
      `He empezado "${requested}" y no había ningún entrenamiento pendiente de ese día, ` +
      'así que lo he registrado en el calendario.'
    );
  }
  const from = input.fromDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return `He movido "${requested}" a hoy. Estaba planificado para el ${from}.`;
}

function compareNearness(todayKey: string, left: Date, right: Date): number {
  const leftDistance = dayDistance(todayKey, utcDateKey(left));
  const rightDistance = dayDistance(todayKey, utcDateKey(right));
  if (leftDistance !== rightDistance) return leftDistance - rightDistance;
  return utcDateKey(left).localeCompare(utcDateKey(right));
}

function dayDistance(todayKey: string, eventKey: string): number {
  const today = Date.parse(`${todayKey}T00:00:00.000Z`);
  const event = Date.parse(`${eventKey}T00:00:00.000Z`);
  return Math.round(Math.abs(today - event) / 86_400_000);
}
