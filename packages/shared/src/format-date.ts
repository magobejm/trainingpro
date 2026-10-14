const formatters = new Map<string, Intl.DateTimeFormat>();

export function formatDate(value: Date | string | null | undefined, locale: string): string {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return formatterFor(locale || 'es').format(date);
}

function formatterFor(locale: string): Intl.DateTimeFormat {
  const cached = formatters.get(locale);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  formatters.set(locale, created);
  return created;
}
