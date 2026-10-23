import type { ViewStyle } from 'react-native';

export type OverlayId =
  | 'help'
  | 'calendar'
  | 'incidents'
  | 'library'
  | 'measures'
  | 'mood'
  | 'nutrition'
  | 'shopping'
  | 'physicalTests'
  | 'planning'
  | 'profile'
  | 'progress'
  | 'routine'
  | 'routineDay'
  | 'scheduledTest'
  | 'session'
  | null;

export type ProgressMode = 'progress' | 'volume';

export type TabId = 'chat' | 'home' | 'more';

export type MoreMenuId = 'calendar' | 'help' | 'incidents' | 'measures' | 'notes' | 'physicalTests' | 'planning' | 'volume';

export const SPRING = { damping: 25, stiffness: 200, useNativeDriver: false } as const;

export const WEB_BLUR_SM = { backdropFilter: 'blur(16px)' } as unknown as ViewStyle;
