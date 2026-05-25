export type LibraryTabId = 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';

export type LibraryTab = {
  id: LibraryTabId;
  labelKey: string;
};

export const LIBRARY_TABS: LibraryTab[] = [
  { id: 'strength', labelKey: 'client.library.tabs.strength' },
  { id: 'cardio', labelKey: 'client.library.tabs.cardio' },
  { id: 'plio', labelKey: 'client.library.tabs.plio' },
  { id: 'mobility', labelKey: 'client.library.tabs.mobility' },
  { id: 'isometric', labelKey: 'client.library.tabs.isometric' },
  { id: 'sport', labelKey: 'client.library.tabs.sport' },
];

export const LIBRARY_TYPE_BADGE: Record<LibraryTabId, { bg: string; text: string }> = {
  cardio: { bg: 'rgba(249,115,22,0.2)', text: '#fdba74' },
  isometric: { bg: 'rgba(20,184,166,0.2)', text: '#5eead4' },
  mobility: { bg: 'rgba(34,197,94,0.2)', text: '#86efac' },
  plio: { bg: 'rgba(234,179,8,0.2)', text: '#fde047' },
  sport: { bg: 'rgba(236,72,153,0.2)', text: '#f9a8d4' },
  strength: { bg: 'rgba(99,102,241,0.2)', text: '#a5b4fc' },
};

export type LibraryDisplayItem = {
  description?: null | string;
  equipment?: null | string;
  icon?: string;
  id: string;
  instructions?: null | string;
  isometricType?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  methodType?: null | string;
  mobilityType?: null | string;
  muscleGroups?: Array<{ id: string; label: string }>;
  name: string;
  notes?: null | string;
  plioType?: null | string;
  scope: string;
  youtubeUrl?: null | string;
};

export function getItemTypeChip(item: LibraryDisplayItem): null | string {
  return item.methodType ?? item.plioType ?? item.mobilityType ?? item.isometricType ?? item.icon ?? null;
}
