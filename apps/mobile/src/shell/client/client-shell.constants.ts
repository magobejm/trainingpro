import type { ViewStyle } from 'react-native';

export type OverlayId =
  | 'calendar'
  | 'incidents'
  | 'library'
  | 'measures'
  | 'mood'
  | 'planning'
  | 'profile'
  | 'progress'
  | 'routine'
  | 'routineDay'
  | 'session'
  | null;

export type ProgressMode = 'progress' | 'volume';

export type TabId = 'chat' | 'home' | 'more';

export type MoreMenuId = 'incidents' | 'measures' | 'notes' | 'planning' | 'volume';

export const SPRING = { damping: 25, stiffness: 200, useNativeDriver: false } as const;

export const WEB_BLUR_SM = { backdropFilter: 'blur(16px)' } as unknown as ViewStyle;
