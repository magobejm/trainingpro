/**
 * Identidad visual común de web y mobile.
 * Cualquier color, espacio o tamaño nuevo se define aquí, no en cada pantalla.
 */

export const colors = {
  // Acción principal
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primarySoft: '#eff6ff',
  primaryBorder: '#bfdbfe',
  onPrimary: '#ffffff',

  // Superficies y bordes
  background: '#f1f5f9',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceInverse: '#0f172a',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',

  // Texto (textMuted cumple AA sobre surface y surfaceMuted)
  text: '#0f172a',
  textMuted: '#64748b',

  // Significado fijo: correcto, aviso, error/borrado e información
  success: '#15803d',
  successSoft: '#dcfce7',
  warning: '#b45309',
  warningSoft: '#fef3c7',
  danger: '#b91c1c',
  dangerHover: '#991b1b',
  dangerSoft: '#fee2e2',
  info: '#0369a1',
  infoSoft: '#e0f2fe',

  // Capa que oscurece el fondo bajo modales y diálogos
  overlay: 'rgba(15, 23, 42, 0.55)',
} as const;

export type ColorToken = keyof typeof colors;
export type ColorPalette = { [K in ColorToken]: string };

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
} as const;

export const fontFamily = {
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  sans: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

export const shadow = {
  sm: { elevation: 1, shadowColor: '#0f172a', shadowOffset: { height: 1, width: 0 }, shadowOpacity: 0.06, shadowRadius: 2 },
  md: { elevation: 3, shadowColor: '#0f172a', shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.08, shadowRadius: 12 },
  lg: {
    elevation: 8,
    shadowColor: '#0f172a',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
} as const;

export type Theme = {
  colors: ColorPalette;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  name: ThemeName;
  radius: typeof radius;
  shadow: typeof shadow;
  space: typeof space;
};

// Para añadir el tema oscuro: ampliar ThemeName con 'dark' y registrar su paleta en `themes`.
export type ThemeName = 'light';

export const lightTheme: Theme = {
  colors,
  fontFamily,
  fontSize,
  name: 'light',
  radius,
  shadow,
  space,
};

export const themes: Record<ThemeName, Theme> = { light: lightTheme };
