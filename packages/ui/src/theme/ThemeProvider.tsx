import React, { createContext, useContext, useMemo } from 'react';
import { brandAccents, lightTheme, themes, type BrandAccent, type Theme, type ThemeName } from './tokens';

const ThemeContext = createContext<Theme>(lightTheme);

type Props = {
  children: React.ReactNode;
  name?: ThemeName;
  accent?: BrandAccent | null;
};

export function ThemeProvider({ children, name = 'light', accent }: Props): React.JSX.Element {
  const theme = useMemo(() => {
    const base = themes[name] ?? lightTheme;
    return accent ? { ...base, colors: { ...base.colors, ...brandAccents[accent][base.name] } } : base;
  }, [name, accent]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Devuelve el tema activo; sin ThemeProvider usa el tema claro. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
