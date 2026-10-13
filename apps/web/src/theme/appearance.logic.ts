import type { ThemeName } from '@trainerpro/ui';

export type AppearanceMode = 'system' | ThemeName;
export type Density = 'comfortable' | 'compact';
export type Appearance = { mode: AppearanceMode; density: Density };
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;
export const DEFAULT_APPEARANCE: Appearance = { mode: 'system', density: 'comfortable' };
const PREFIX = 'trainerpro.web.appearance.';

export function parseAppearance(raw: string | null): Appearance {
  try {
    const value = JSON.parse(raw ?? '{}') as Partial<Appearance> | null;
    return {
      mode: value?.mode === 'light' || value?.mode === 'dark' ? value.mode : 'system',
      density: value?.density === 'compact' ? 'compact' : 'comfortable',
    };
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}
export function readAppearance(storage: Storage | undefined, userKey: string | null): Appearance {
  try {
    return parseAppearance(userKey ? (storage?.getItem(PREFIX + userKey) ?? null) : null);
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}
export function saveAppearance(storage: Storage | undefined, userKey: string | null, appearance: Appearance): void {
  try {
    if (userKey) storage?.setItem(PREFIX + userKey, JSON.stringify(appearance));
  } catch {
    /* session preference remains usable */
  }
}
export function resolveAppearanceTheme(mode: AppearanceMode, systemDark: boolean): ThemeName {
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
}
export function decodeUserKey(token: string | null): string | null {
  try {
    const payload = token?.split('.')[1];
    if (!payload) return null;
    const value = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: unknown };
    return typeof value.sub === 'string' && value.sub ? value.sub : null;
  } catch {
    return null;
  }
}
export function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
