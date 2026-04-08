import type { CalendarColor } from './calendar-screen.types';
import { CALENDAR_COLORS } from './calendar-screen.types';

export type CalendarCell = { day: number; dateStr: string; isCurrentMonth: boolean };

export function getWeeks(year: number, month: number): CalendarCell[][] {
  const cells = getMonthGrid(year, month);
  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function getMonthGrid(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  // Monday-based: Sunday (0) becomes 6, Monday (1) becomes 0, etc.
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const dayOffset = i - startOffset + 1;
    // JS Date handles month overflow: new Date(2026, 3, 0) = Mar 31, new Date(2026, 3, 31) = May 1
    const d = new Date(year, month, dayOffset);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isCurrentMonth = dayOffset >= 1 && dayOffset <= daysInMonth;
    return { day: d.getDate(), dateStr, isCurrentMonth };
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

/** Full date range of the grid including padding cells from prev/next months. */
export function gridRangeDates(year: number, month: number): { dateFrom: string; dateTo: string } {
  const cells = getMonthGrid(year, month);
  return { dateFrom: cells[0]!.dateStr, dateTo: cells[cells.length - 1]!.dateStr };
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
