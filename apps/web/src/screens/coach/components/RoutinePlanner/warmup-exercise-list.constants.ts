export const ICON_DETAIL = '🔍';
export const ICON_COLLAPSE = '▲';
export const ICON_EXPAND = '▼';
export const ICON_SET_NOTE = '📝';
export const MODAL_ANIM = 'fade' as const;
export const NOTE_ACTION_COL_W = 48;
export const RESIZE_COVER = 'cover' as const;
export const ACCESSIBILITY_ROLE_BUTTON = 'button' as const;
export const TITLE_MAX_LINES = 2;

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  cardio: 'Cardio',
  isometric: 'Isométrico',
  mobility: 'Movilidad',
  plio: 'Pliométrico',
  sport: 'Deporte',
  strength: 'Fuerza',
};

export const BLOCK_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  cardio: { bg: '#dbeafe', text: '#2563eb' },
  isometric: { bg: '#fce7f3', text: '#be185d' },
  mobility: { bg: '#ecfccb', text: '#16a34a' },
  plio: { bg: '#fef3c7', text: '#d97706' },
  sport: { bg: '#f1f5f9', text: '#64748b' },
  strength: { bg: '#f3e8ff', text: '#9333ea' },
};

export const BASE_CATEGORY_MAP: Record<string, string> = {
  strength: 'muscleGroups',
  cardio: 'cardioMethodTypes',
  isometric: 'isometricTypes',
  plio: 'plioTypes',
  mobility: 'mobilityTypes',
  sport: 'sportTypes',
};
