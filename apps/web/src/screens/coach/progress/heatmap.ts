export type HeatSession = { sessionDate: string; totalTonnage: number };
export type HeatLevel = 0 | 1 | 2 | 3 | 4;
export type HeatCell = { date: string; level: HeatLevel; tonnage: number };
export type HeatmapModel = {
  bestStreak: number;
  currentStreak: number;
  trainedDays: number;
  weeks: HeatCell[][];
};

const WEEKS = 26;
const MS_PER_DAY = 86_400_000;

/** Cuadrícula de lunes a domingo, 26 semanas, con la intensidad según el tonelaje. */
export function buildHeatmap(sessions: HeatSession[], today: Date): HeatmapModel {
  const byDate = new Map<string, number>();
  for (const session of sessions) {
    const date = session.sessionDate.slice(0, 10);
    byDate.set(date, (byDate.get(date) ?? 0) + session.totalTonnage);
  }
  const end = endOfWeekSunday(today);
  const start = addDays(end, -(WEEKS * 7 - 1));
  const thresholds = quartiles([...byDate.values()].filter((value) => value > 0));
  const weeks: HeatCell[][] = [];
  for (let week = 0; week < WEEKS; week += 1) {
    const column: HeatCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = formatDay(addDays(start, week * 7 + day));
      const tonnage = byDate.get(date) ?? 0;
      column.push({ date, level: levelFor(tonnage, thresholds), tonnage });
    }
    weeks.push(column);
  }
  const trained = [...byDate.keys()].filter((date) => (byDate.get(date) ?? 0) > 0 || byDate.has(date));
  const streaks = streakStats(new Set(trained), formatDay(today));
  return { bestStreak: streaks.best, currentStreak: streaks.current, trainedDays: trained.length, weeks };
}

function quartiles(values: number[]): [number, number, number] {
  if (!values.length) return [0, 0, 0];
  const sorted = [...values].sort((left, right) => left - right);
  return [percentile(sorted, 0.25), percentile(sorted, 0.5), percentile(sorted, 0.75)];
}

function percentile(sorted: number[], ratio: number): number {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index] ?? 0;
}

function levelFor(tonnage: number, thresholds: [number, number, number]): HeatLevel {
  if (tonnage <= 0) return 0;
  if (tonnage <= thresholds[0]) return 1;
  if (tonnage <= thresholds[1]) return 2;
  if (tonnage <= thresholds[2]) return 3;
  return 4;
}

function streakStats(dates: Set<string>, today: string): { best: number; current: number } {
  const sorted = [...dates].sort();
  let best = 0;
  let run = 0;
  let previous = '';
  for (const date of sorted) {
    run = previous && nextDay(previous) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  let current = 0;
  let cursor = dates.has(today) ? today : previousDay(today);
  while (dates.has(cursor)) {
    current += 1;
    cursor = previousDay(cursor);
  }
  return { best, current };
}

function endOfWeekSunday(today: Date): Date {
  const utc = utcMidnight(today);
  const weekday = utc.getUTCDay();
  return addDays(utc, weekday === 0 ? 0 : 7 - weekday);
}

function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextDay(date: string): string {
  return formatDay(addDays(new Date(`${date}T00:00:00.000Z`), 1));
}

function previousDay(date: string): string {
  return formatDay(addDays(new Date(`${date}T00:00:00.000Z`), -1));
}

export function heatmapRange(today: Date): { from: string; to: string } {
  const end = endOfWeekSunday(today);
  return { from: formatDay(addDays(end, -(WEEKS * 7 - 1))), to: formatDay(end) };
}
