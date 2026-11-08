import type { WellnessTrendPoint } from '@trainerpro/shared';

export type MoodSeriesKey = 'motivation' | 'recovery' | 'sleep';

export const MOOD_SERIES: readonly MoodSeriesKey[] = ['sleep', 'motivation', 'recovery'];
export const CHART_Y_MIN = 1;
export const CHART_Y_MAX = 5;

export type ChartGeometry = {
  height: number;
  padBottom: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  width: number;
};

export function plotHeight(g: ChartGeometry): number {
  return g.height - g.padTop - g.padBottom;
}

/** Centro de la columna de cada día: así las barras de RPE y los puntos quedan alineados. */
export function columnWidth(count: number, g: ChartGeometry): number {
  return (g.width - g.padLeft - g.padRight) / Math.max(count, 1);
}

export function xAt(index: number, count: number, g: ChartGeometry): number {
  return g.padLeft + columnWidth(count, g) * (index + 0.5);
}

export function yAt(value: number, g: ChartGeometry): number {
  const clamped = Math.min(CHART_Y_MAX, Math.max(CHART_Y_MIN, value));
  return g.padTop + ((CHART_Y_MAX - clamped) / (CHART_Y_MAX - CHART_Y_MIN)) * plotHeight(g);
}

/** Un trazo por tramo continuo: los días omitidos cortan la línea en lugar de bajarla a cero. */
export function seriesSegments(points: readonly WellnessTrendPoint[], key: MoodSeriesKey, g: ChartGeometry): string[] {
  const segments: string[] = [];
  let current: string[] = [];
  points.forEach((point, index) => {
    const value = point[key];
    if (value === null) {
      if (current.length > 0) segments.push(current.join(' '));
      current = [];
      return;
    }
    current.push(
      `${current.length === 0 ? 'M' : 'L'} ${xAt(index, points.length, g).toFixed(1)} ${yAt(value, g).toFixed(1)}`,
    );
  });
  if (current.length > 0) segments.push(current.join(' '));
  return segments;
}

/** Altura de la barra de RPE (ya dividido entre 2) desde la línea base del eje. */
export function rpeBarHeight(rpeScaled: number, g: ChartGeometry): number {
  const base = yAt(CHART_Y_MIN, g);
  return Math.max(3, base - yAt(rpeScaled, g));
}

export function dayTick(date: string): string {
  return date.slice(8, 10);
}

export function tickEvery(count: number): number {
  return count <= 7 ? 1 : 5;
}
