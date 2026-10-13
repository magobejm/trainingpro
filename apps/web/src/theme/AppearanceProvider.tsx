import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { brandAccents, ThemeProvider, themes, type BrandAccent, type ThemeName } from '@trainerpro/ui';
import { useAuthStore } from '../store/auth.store';
import { useBranding } from '../data/hooks/useBranding';
import {
  browserStorage,
  decodeUserKey,
  readAppearance,
  resolveAppearanceTheme,
  saveAppearance,
  type Appearance,
} from './appearance.logic';

type AppearanceContextValue = Appearance & { setAppearance: (next: Partial<Appearance>) => void };
const AppearanceContext = createContext<AppearanceContextValue>({
  mode: 'system',
  density: 'comfortable',
  setAppearance: () => {},
});
export const useAppearance = () => useContext(AppearanceContext);

function applyAppearance(name: ThemeName, density: Appearance['density'], accent?: BrandAccent | null): void {
  const colors = { ...themes[name].colors, ...(accent ? brandAccents[accent][name] : {}) };
  const root = document.documentElement;
  for (const [key, color] of Object.entries(colors)) root.style.setProperty(`--tp-${key}`, color);
  root.dataset.theme = name;
  root.dataset.density = density;
  root.style.colorScheme = name;
}

/** Runs before React paints, using the same authenticated storage key as the provider. */
export function bootstrapAppearance(): void {
  const auth = useAuthStore.getState();
  const appearance = readAppearance(browserStorage(), decodeUserKey(auth.accessToken));
  applyAppearance(
    resolveAppearanceTheme(appearance.mode, window.matchMedia('(prefers-color-scheme: dark)').matches),
    appearance.density,
  );
}

export function AppearanceProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const token = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.activeRole);
  const key = decodeUserKey(token);
  const [saved, setSaved] = useState(() => ({ key, value: readAppearance(browserStorage(), key) }));
  const appearance = saved.key === key ? saved.value : readAppearance(browserStorage(), key);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const branding = useBranding();
  const accent = role === 'coach' ? branding.data?.brandAccent : null;
  const name = resolveAppearanceTheme(appearance.mode, systemDark);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);
  useLayoutEffect(() => {
    applyAppearance(name, appearance.density, accent);
  }, [name, appearance.density, accent]);
  const value = useMemo(
    () => ({
      ...appearance,
      setAppearance: (next: Partial<Appearance>) => {
        const merged = { ...appearance, ...next };
        saveAppearance(browserStorage(), key, merged);
        setSaved({ key, value: merged });
      },
    }),
    [appearance.mode, appearance.density, key],
  );
  return (
    <AppearanceContext.Provider value={value}>
      <ThemeProvider name={name} accent={accent}>
        {children}
      </ThemeProvider>
    </AppearanceContext.Provider>
  );
}
