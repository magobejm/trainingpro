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

/** Una curva por serie: une los días con dato y no baja a cero cuando falta un día. */
export function seriesSegments(points: readonly WellnessTrendPoint[], key: MoodSeriesKey, g: ChartGeometry): string[] {
  const samples: Array<{ x: number; y: number }> = [];
  points.forEach((point, index) => {
    const value = point[key];
    if (value === null) return;
    samples.push({ x: xAt(index, points.length, g), y: yAt(value, g) });
  });
  const path = monotoneCurve(samples);
  return path ? [path] : [];
}

type CurvePoint = { x: number; y: number };
type CurveSpan = { from: CurvePoint; slope: number; step: number; to: CurvePoint };

/** Cúbica monótona: pasa por cada punto y no se sale del rango entre dos valores. */
function monotoneCurve(samples: readonly CurvePoint[]): string | null {
  const spans = curveSpans(samples);
  const first = spans[0];
  if (!first) return null;
  const tangent = curveTangents(spans);
  const command = [`M ${first.from.x.toFixed(1)} ${first.from.y.toFixed(1)}`];
  spans.forEach((span, index) => {
    const start = tangent[index] ?? 0;
    const end = tangent[index + 1] ?? 0;
    const c1x = span.from.x + span.step / 3;
    const c1y = span.from.y + (start * span.step) / 3;
    const c2x = span.to.x - span.step / 3;
    const c2y = span.to.y - (end * span.step) / 3;
    const controls = `${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)}`;
    command.push(`C ${controls} ${span.to.x.toFixed(1)} ${span.to.y.toFixed(1)}`);
  });
  return command.join(' ');
}

function curveSpans(samples: readonly CurvePoint[]): CurveSpan[] {
  const spans: CurveSpan[] = [];
  samples.forEach((from, index) => {
    const to = samples[index + 1];
    if (!to) return;
    const step = to.x - from.x;
    spans.push({ from, to, step, slope: step === 0 ? 0 : (to.y - from.y) / step });
  });
  return spans;
}

function curveTangents(spans: readonly CurveSpan[]): number[] {
  const slopes = spans.map((span) => span.slope);
  const last = slopes[slopes.length - 1] ?? 0;
  const tangent = slopes.map((slope, index) => {
    if (index === 0) return slope;
    const previous = slopes[index - 1] ?? 0;
    return previous * slope <= 0 ? 0 : (previous + slope) / 2;
  });
  tangent.push(last);
  spans.forEach((span, index) => {
    if (span.slope === 0) {
      tangent[index] = 0;
      tangent[index + 1] = 0;
      return;
    }
    const start = tangent[index] ?? 0;
    const end = tangent[index + 1] ?? 0;
    const a = start / span.slope;
    const b = end / span.slope;
    const size = a * a + b * b;
    if (size > 9) {
      const scale = 3 / Math.sqrt(size);
      tangent[index] = scale * a * span.slope;
      tangent[index + 1] = scale * b * span.slope;
    }
  });
  return tangent;
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
