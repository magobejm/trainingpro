import type { jsPDF } from 'jspdf';
import type { PdfChart } from './pdf-model';
import { lightColors } from '@trainerpro/ui';

function chartColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const token = /^var\(--tp-([a-zA-Z]+)(?:,|\))/.exec(value)?.[1];
  return token && token in lightColors ? lightColors[token as keyof typeof lightColors] : fallback;
}

/** Fixed-size vector plot: independent of viewport, browser theme and animations. */
export function drawChart(
  pdf: jsPDF,
  chart: PdfChart,
  x: number,
  y: number,
  width: number,
  height: number,
  accent: string,
): void {
  const values = chart.points.map((point) => point.value).filter((value): value is number => value !== null);
  if (values.some((value) => !Number.isFinite(value))) throw new Error('Invalid chart data');
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const left = x + 16;
  const top = y + 4;
  const bottom = y + height - 10;
  const right = x + width - 4;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor('#526175');
  for (let tick = 0; tick <= 4; tick++) {
    const level = min + ((max - min) * tick) / 4;
    const py = bottom - ((bottom - top) * tick) / 4;
    pdf.setDrawColor('#dde3eb');
    pdf.setLineWidth(0.15);
    pdf.line(left, py, right, py);
    pdf.text(String(Math.round(level * 10) / 10), left - 2, py + 1, { align: 'right' });
  }
  const step = (right - left) / Math.max(1, chart.points.length - 1);
  let previous: { x: number; y: number } | null = null;
  chart.points.forEach((point, index) => {
    if (point.value === null) {
      previous = null;
      return;
    }
    const px = left + index * step;
    const py = bottom - ((point.value - min) / (max - min)) * (bottom - top);
    pdf.setDrawColor(chartColor(chart.color, accent));
    pdf.setFillColor(chartColor(chart.color, accent));
    pdf.setLineWidth(0.55);
    if (previous) pdf.line(previous.x, previous.y, px, py);
    pdf.circle(px, py, 0.6, 'F');
    previous = { x: px, y: py };
  });
  const last = chart.points.at(-1);
  if (chart.points[0]) pdf.text(chart.points[0].label, left, bottom + 5);
  if (last && chart.points.length > 1) pdf.text(last.label, right, bottom + 5, { align: 'right' });
  if (chart.unit) pdf.text(chart.unit, x, y + height - 1);
}

export function drawHeatmap(
  pdf: jsPDF,
  weeks: { date: string; level: number }[][],
  x: number,
  y: number,
  accent: string,
): void {
  const base = [1, 3, 5].map((index) => parseInt(accent.slice(index, index + 2), 16));
  weeks.forEach((week, column) =>
    week.forEach((cell, row) => {
      const alpha = cell.level === 0 ? 0.06 : 0.15 + cell.level * 0.2;
      const rgb = base.map((value) => Math.round(255 + (value - 255) * alpha));
      pdf.setFillColor(rgb[0]!, rgb[1]!, rgb[2]!);
      pdf.roundedRect(x + column * 6.6, y + row * 4.4, 5.4, 3.6, 0.6, 0.6, 'F');
    }),
  );
  pdf.setFontSize(8);
  pdf.setTextColor('#526175');
  pdf.text(weeks[0]?.[0]?.date ?? '', x, y + 36);
  pdf.text(weeks.at(-1)?.at(-1)?.date ?? '', x + 170, y + 36, { align: 'right' });
}
