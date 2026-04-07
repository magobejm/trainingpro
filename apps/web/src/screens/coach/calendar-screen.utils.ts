import type { CalendarColor } from './calendar-screen.types';
import { CALENDAR_COLORS } from './calendar-screen.types';

export function getWeeks(year: number, month: number): Array<Array<{ day: number | null; dateStr: string | null }>> {
  const cells = getMonthGrid(year, month);
  const weeks: Array<Array<{ day: number | null; dateStr: string | null }>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function getMonthGrid(year: number, month: number): Array<{ day: number | null; dateStr: string | null }> {
  const firstDay = new Date(year, month, 1).getDay();
  // Monday-based: Sunday (0) becomes 6, Monday (1) becomes 0, etc.
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const day = i - startOffset + 1;
    if (day < 1 || day > daysInMonth) return { day: null, dateStr: null };
    const dateStr = toDateStr(year, month, day);
    return { day, dateStr };
  });
}

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function monthRangeDates(year: number, month: number): { dateFrom: string; dateTo: string } {
  const dateFrom = toDateStr(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dateTo = toDateStr(year, month, daysInMonth);
  return { dateFrom, dateTo };
}

export function formatCalendarDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getColorForHex(hex: string): CalendarColor {
  return CALENDAR_COLORS.find((c) => c.bg === hex) ?? (CALENDAR_COLORS[0] as CalendarColor);
}

export const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const DAY_NAMES_ES = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
