export type NoteListItem = {
  content: string;
  date: string;
};

export type NoteRow =
  | { key: string; kind: 'month'; title: string }
  | { content: string; date: string; key: string; kind: 'note'; label: string };

export function todayKey(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return todayKey(value);
}

export function dayLabel(date: string, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', weekday: 'short' }).formatToParts(
    new Date(`${date}T12:00:00`),
  );
  return parts
    .filter((part) => part.type === 'weekday' || part.type === 'day' || part.type === 'month')
    .map((part) => part.value.replace(/\./g, ''))
    .join(' ')
    .toLowerCase();
}

export function buildNoteRows(items: NoteListItem[], locale: string): NoteRow[] {
  const rows: NoteRow[] = [];
  let month = '';
  for (const item of items) {
    const title = monthTitle(item.date, locale);
    if (title !== month) {
      month = title;
      rows.push({ key: `month-${item.date.slice(0, 7)}`, kind: 'month', title });
    }
    rows.push({ content: item.content, date: item.date, key: item.date, kind: 'note', label: dayLabel(item.date, locale) });
  }
  return rows;
}

function monthTitle(date: string, locale: string): string {
  const value = new Date(`${date}T12:00:00`);
  const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(value);
  return `${month} ${value.getFullYear()}`.toLowerCase();
}
