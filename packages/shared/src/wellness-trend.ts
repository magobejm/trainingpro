/**
 * Puntos de la gráfica de ánimo: cruza las preguntas iniciales (1-5) con el RPE de la sesión.
 * Lo que el cliente omite queda como `null` (hueco), nunca como cero, para no falsear la tendencia.
 */

export type WellnessTrendCheckin = {
  date: string;
  motivation: number | null;
  recovery: number | null;
  sleep: number | null;
};
export type WellnessTrendSession = { sessionDate: string; sessionRpe: number | null; isCompleted?: boolean };

export type WellnessTrendPoint = {
  date: string;
  motivation: number | null;
  recovery: number | null;
  /** RPE real (1-10) de la sesión del día, o `null` si no entrenó o no lo contestó. */
  rpe: number | null;
  /** RPE dividido entre 2 para encajar en el eje 1-5. */
  rpeScaled: number | null;
  sleep: number | null;
  trained: boolean;
};

export type WellnessTrendRange = 7 | 30;

const DAY_MS = 86_400_000;

export function rpeToScale(rpe: number | null | undefined): number | null {
  if (rpe === null || rpe === undefined || !Number.isFinite(rpe)) return null;
  return rpe / 2;
}

function keyAt(endKey: string, offset: number): string {
  return new Date(Date.parse(`${endKey}T00:00:00.000Z`) + offset * DAY_MS).toISOString().slice(0, 10);
}

/** Un punto por día de los últimos `range` días, acabando en `endDate`, trabajados o de descanso. */
export function buildWellnessTrend(input: {
  checkins: readonly WellnessTrendCheckin[];
  endDate: string;
  range: WellnessTrendRange;
  sessions: readonly WellnessTrendSession[];
}): WellnessTrendPoint[] {
  const checkinByDate = new Map(input.checkins.map((c) => [c.date, c]));
  const sessionsByDate = new Map<string, WellnessTrendSession[]>();
  for (const session of input.sessions) {
    if (session.isCompleted === false) continue;
    const list = sessionsByDate.get(session.sessionDate) ?? [];
    list.push(session);
    sessionsByDate.set(session.sessionDate, list);
  }
  const points: WellnessTrendPoint[] = [];
  for (let i = input.range - 1; i >= 0; i -= 1) {
    const date = keyAt(input.endDate, -i);
    const checkin = checkinByDate.get(date);
    const sessions = sessionsByDate.get(date) ?? [];
    const rpes = sessions.map((s) => s.sessionRpe).filter((v): v is number => typeof v === 'number');
    const rpe = rpes.length > 0 ? Math.max(...rpes) : null;
    points.push({
      date,
      motivation: checkin?.motivation ?? null,
      recovery: checkin?.recovery ?? null,
      rpe,
      rpeScaled: rpeToScale(rpe),
      sleep: checkin?.sleep ?? null,
      trained: sessions.length > 0,
    });
  }
  return points;
}

/** Media de una serie ignorando huecos; `null` si no hay ningún dato. */
export function averageOfSeries(values: ReadonlyArray<number | null>): number | null {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return Math.round((present.reduce((sum, v) => sum + v, 0) / present.length) * 10) / 10;
}
