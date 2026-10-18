export type Translate = (key: string, options?: Record<string, unknown>) => string;
const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const hidden = /^(?:id|.*Id|.*Ids|code|isDefault|createdAt|updatedAt|archivedAt|revisionVersion|templateVersion)$/;
export function visibleComparisonField(field: string) {
  return !field.split('.').some((part) => hidden.test(part));
}
export function fieldLabel(field: string, t: Translate): string {
  return field
    .split('.')
    .map((part) =>
      /^\d+$/.test(part)
        ? String(Number(part) + 1)
        : t(`routineVersions.fields.${part}`, { defaultValue: part.replace(/([A-Z])/g, ' $1') }),
    )
    .join(' · ');
}
/** Keep prescriptions visible, but never render database identities or catalog metadata. */
export function valueLabel(value: unknown, t: Translate, field = ''): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return t(value ? 'routineVersions.yes' : 'routineVersions.no');
  if (Array.isArray(value))
    return (
      value
        .map((item) => valueLabel(item, t, field))
        .filter((item) => item !== '—')
        .join('\n\n') || '—'
    );
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    if (field === 'objectives' && typeof row.label === 'string') return valueLabel(row.label, t);
    return (
      Object.entries(row)
        .filter(([key, item]) => !hidden.test(key) && item != null && item !== '')
        .map(([key, item]) => ({ label: fieldLabel(key, t), value: valueLabel(item, t, key) }))
        .filter((item) => item.value !== '—')
        .map((item) => `${item.label}: ${item.value}`)
        .join('\n') || '—'
    );
  }
  if (typeof value === 'number' && field === 'setIndex') return String(value + 1);
  if (typeof value === 'string') {
    if (uuid.test(value)) return '—';
    if (['strength', 'cardio', 'mobility', 'isometric', 'plio', 'sport', 'warmupTemplate'].includes(value))
      return t(`coach.routine.blockType.${value}`, { defaultValue: value });
    return t(`routineVersions.values.${value}`, { defaultValue: value });
  }
  return String(value);
}
