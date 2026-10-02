export type IncidentCategory = 'dolor' | 'lesion' | 'molestia' | 'otro';

const KNOWN_CATEGORIES: IncidentCategory[] = ['dolor', 'lesion', 'molestia', 'otro'];

export function resolveIncidentCategory(tag: null | string | undefined, severity: string): IncidentCategory {
  const normalized = tag?.trim().toLowerCase();
  if (normalized && KNOWN_CATEGORIES.includes(normalized as IncidentCategory)) {
    return normalized as IncidentCategory;
  }
  if (severity === 'HIGH' || severity === 'CRITICAL') {
    return 'lesion';
  }
  if (severity === 'MEDIUM') {
    return 'dolor';
  }
  return 'molestia';
}

export function formatIncidentChatNotice(input: { category: string; date: string; description: string }): string {
  return ['⚠️ Incidencia', `📅 Fecha: ${input.date}`, `⚡ Gravedad: ${input.category}`, `📝 ${input.description}`].join(
    '\n',
  );
}

export function formatIncidentDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = String(parsed.getFullYear());
  return `${day}/${month}/${year}`;
}
