import type { LibraryCatalogItem } from '../../data/hooks/useLibraryQuery';
import { isYouTubeUrl } from './library-media.helpers';

export function buildCardioChips(
  items: LibraryCatalogItem[],
  t: (key: string) => string,
): Array<{ id: string; label: string }> {
  return [{ id: 'all', label: t('coach.library.cardio.filters.all') }, ...items.map(toChip)];
}

export function findDefaultCardioTypeId(items: LibraryCatalogItem[]): string {
  return items.find((item) => item.isDefault)?.id ?? items[0]?.id ?? '';
}

export function resolveCardioTypeId(
  value: string,
  activeFilter: string,
  defaultId: string,
): string {
  const explicit = value.trim();
  if (explicit) {
    return explicit;
  }
  if (activeFilter && activeFilter !== 'all') {
    return activeFilter;
  }
  return defaultId;
}

export function validateCardioYoutube(value: string): null | string {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return isYouTubeUrl(trimmed) ? null : 'coach.library.media.errors.invalidYoutube';
}

function toChip(item: LibraryCatalogItem) {
  return { id: item.id, label: item.label };
}
