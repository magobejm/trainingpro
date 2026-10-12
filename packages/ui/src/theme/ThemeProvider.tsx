import React, { createContext, useContext, useMemo } from 'react';
import { lightTheme, themes, type Theme, type ThemeName } from './tokens';

const ThemeContext = createContext<Theme>(lightTheme);

type Props = {
  children: React.ReactNode;
  name?: ThemeName;
};

export function ThemeProvider({ children, name = 'light' }: Props): React.JSX.Element {
  const theme = useMemo(() => themes[name] ?? lightTheme, [name]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Devuelve el tema activo; sin ThemeProvider usa el tema claro. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
