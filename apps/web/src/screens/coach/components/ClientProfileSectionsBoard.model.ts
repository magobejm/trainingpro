import type { ClientManagementSectionView } from '../../../data/hooks/useClientManagementSections';
import { SECTIONS, type SectionId, type SectionItem } from './ClientProfileSectionsBoard.types';

export type SectionLists = {
  activeSections: SectionItem[];
  archivedSections: SectionItem[];
};

export function buildSectionLists(items: ClientManagementSectionView[]): SectionLists {
  const active = items
    .filter((item) => !item.archived)
    .sort(compareByOrder)
    .map((item) => findSection(item.code))
    .filter(isDefined);
  const archived = items
    .filter((item) => item.archived)
    .sort(compareByOrder)
    .map((item) => findSection(item.code))
    .filter(isDefined);
  return { activeSections: active, archivedSections: archived };
}

export function archiveSection(
  items: ClientManagementSectionView[],
  id: SectionId,
): ClientManagementSectionView[] {
  const next = items.map((item) => (item.code === id ? { ...item, archived: true } : item));
  return normalizeOrder(next);
}

export function restoreSection(
  items: ClientManagementSectionView[],
  id: SectionId,
): ClientManagementSectionView[] {
  const next = items.map((item) => (item.code === id ? { ...item, archived: false } : item));
  return normalizeOrder(next);
}

export function reorderSections(
  items: ClientManagementSectionView[],
  draggedId: SectionId,
  targetId: SectionId,
): ClientManagementSectionView[] {
  if (draggedId === targetId) return items;
  const active = items.filter((item) => !item.archived).sort(compareByOrder);
  const archived = items.filter((item) => item.archived).sort(compareByOrder);
  const from = active.findIndex((item) => item.code === draggedId);
  const to = active.findIndex((item) => item.code === targetId);
  if (from < 0 || to < 0) return items;
  const nextActive = [...active];
  const [moving] = nextActive.splice(from, 1);
  if (!moving) return items;
  nextActive.splice(to, 0, moving);
  return normalizeOrder([...nextActive, ...archived]);
}

export function reorderSectionsByActiveIndex(
  items: ClientManagementSectionView[],
  fromIndex: number,
  toIndex: number,
): ClientManagementSectionView[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  const active = items.filter((item) => !item.archived).sort(compareByOrder);
  const archived = items.filter((item) => item.archived).sort(compareByOrder);
  if (fromIndex >= active.length || toIndex >= active.length) return items;
  const nextActive = [...active];
  const [moving] = nextActive.splice(fromIndex, 1);
  if (!moving) return items;
  nextActive.splice(toIndex, 0, moving);
  return normalizeOrder([...nextActive, ...archived]);
}

export function normalizeOrder(
  items: ClientManagementSectionView[],
): ClientManagementSectionView[] {
  return items.map((item, index) => ({ ...item, sortOrder: index }));
}

function compareByOrder(a: { sortOrder: number }, b: { sortOrder: number }): number {
  return a.sortOrder - b.sortOrder;
}

function findSection(id: SectionId): SectionItem | undefined {
  return SECTIONS.find((section) => section.id === id);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
