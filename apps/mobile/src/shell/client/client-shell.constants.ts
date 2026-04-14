import type { ViewStyle } from 'react-native';

export type OverlayId = 'menu' | 'profile' | 'routine' | 'routineDay' | null;

export const WEB_BLUR_SM = { backdropFilter: 'blur(16px)' } as unknown as ViewStyle;
export const WEB_BLUR_LG = { filter: 'blur(100px)' } as unknown as ViewStyle;
export const SPRING = { damping: 25, stiffness: 200, useNativeDriver: false } as const;

export type MenuItem = { emoji: string; id: string; label: string };

export const MENU_ITEMS: MenuItem[] = [
  { emoji: '📐', id: 'measures', label: 'Medidas antro.' },
  { emoji: '📝', id: 'notes', label: 'Bloc de notas' },
  { emoji: '💬', id: 'chat', label: 'Chat' },
  { emoji: '⚠️', id: 'incidents', label: 'Incidencias' },
  { emoji: '📅', id: 'calendar', label: 'Calendario' },
  { emoji: '📊', id: 'volume', label: 'Volumen semanal' },
  { emoji: '📋', id: 'planning', label: 'Planificación' },
  { emoji: '💳', id: 'payment', label: 'Métodos pago' },
  { emoji: '🏃', id: 'external', label: 'Entrenos ext.' },
  { emoji: '📚', id: 'exercises', label: 'Biblio. Ejercicios' },
  { emoji: '📖', id: 'routines', label: 'Biblio. Rutinas' },
];
