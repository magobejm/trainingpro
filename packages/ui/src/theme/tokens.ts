/**
 * Identidad visual común de web y mobile.
 * Cualquier color, espacio o tamaño nuevo se define aquí, no en cada pantalla.
 */

export const lightColors = {
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
  textInverse: '#ffffff',
  textInverseMuted: '#94a3b8',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',

  // Texto (textMuted cumple AA sobre surface y surfaceMuted)
  text: '#0f172a',
  textMuted: '#5b6b80',

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

  // Series de gráficas y categorías: misma identidad en todas las pantallas.
  chartPurple: '#7c3aed',
  chartPurpleSoft: '#f3e8ff',
  chartTeal: '#0f766e',
  chartTealSoft: '#ccfbf1',
  chartPink: '#be185d',
  chartPinkSoft: '#fce7f3',

  // Capa que oscurece el fondo bajo modales y diálogos
  overlay: 'rgba(15, 23, 42, 0.55)',
  shadowColor: 'rgba(15, 23, 42, 0.12)',
  imageOverlay: 'rgba(0, 0, 0, 0.6)',
  imageOverlaySoft: 'rgba(0, 0, 0, 0.2)',
  imageControlSoft: 'rgba(255, 255, 255, 0.2)',
  imageControlBorder: 'rgba(255, 255, 255, 0.4)',
} as const;

export type ColorToken = keyof typeof lightColors;
export type ColorPalette = { [K in ColorToken]: string };

/** Static styles retain variable references on web; native always receives literal colors. */
export function paletteForWeb(palette: ColorPalette, web: boolean): ColorPalette {
  return Object.fromEntries(
    Object.entries(palette).map(([key, value]) => [key, web ? `var(--tp-${key}, ${value})` : value]),
  ) as ColorPalette;
}

export const colors = paletteForWeb(lightColors, typeof document !== 'undefined');

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
export type ThemeName = 'dark' | 'light';

export const lightTheme: Theme = {
  colors: lightColors,
  fontFamily,
  fontSize,
  name: 'light',
  radius,
  shadow,
  space,
};

export const darkTheme: Theme = {
  ...lightTheme,
  name: 'dark',
  colors: {
    ...lightColors,
    background: '#0f172a',
    surface: '#182337',
    surfaceMuted: '#1e293b',
    surfaceInverse: '#020617',
    border: '#475569',
    borderStrong: '#64748b',
    text: '#f1f5f9',
    textMuted: '#b8c5d6',
    primary: '#93c5fd',
    primaryHover: '#bfdbfe',
    primarySoft: '#172f50',
    primaryBorder: '#60a5fa',
    onPrimary: '#0f172a',
    success: '#86efac',
    successSoft: '#143526',
    warning: '#fcd34d',
    warningSoft: '#3d3018',
    danger: '#fca5a5',
    dangerHover: '#fecaca',
    dangerSoft: '#451e29',
    info: '#7dd3fc',
    infoSoft: '#153448',
    chartPurple: '#c4b5fd',
    chartPurpleSoft: '#302446',
    chartTeal: '#5eead4',
    chartTealSoft: '#123c39',
    chartPink: '#f9a8d4',
    chartPinkSoft: '#43233b',
    overlay: 'rgba(0, 0, 0, 0.65)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
  },
};

export type BrandAccent = 'blue' | 'indigo' | 'violet' | 'teal' | 'green' | 'orange' | 'pink' | 'slate';
type AccentPalette = Pick<ColorPalette, 'primary' | 'primaryHover' | 'primarySoft' | 'primaryBorder' | 'onPrimary'>;
function accent(
  light: string,
  hover: string,
  soft: string,
  border: string,
  dark: string,
  darkHover: string,
  darkSoft: string,
): Record<ThemeName, AccentPalette> {
  return {
    light: {
      primary: light,
      primaryHover: hover,
      primarySoft: soft,
      primaryBorder: border,
      onPrimary: lightColors.onPrimary,
    },
    dark: {
      primary: dark,
      primaryHover: darkHover,
      primarySoft: darkSoft,
      primaryBorder: dark,
      onPrimary: lightColors.text,
    },
  };
}
export const brandAccents: Record<BrandAccent, Record<ThemeName, AccentPalette>> = {
  blue: accent('#2563eb', '#1d4ed8', '#eff6ff', '#bfdbfe', '#93c5fd', '#bfdbfe', '#172f50'),
  indigo: accent('#4f46e5', '#4338ca', '#eef2ff', '#c7d2fe', '#a5b4fc', '#c7d2fe', '#28284d'),
  violet: accent('#7c3aed', '#6d28d9', '#f5f3ff', '#ddd6fe', '#c4b5fd', '#ddd6fe', '#302446'),
  teal: accent('#0f766e', '#115e59', '#f0fdfa', '#99f6e4', '#5eead4', '#99f6e4', '#123c39'),
  green: accent('#15803d', '#166534', '#f0fdf4', '#bbf7d0', '#86efac', '#bbf7d0', '#143526'),
  orange: accent('#c2410c', '#9a3412', '#fff7ed', '#fed7aa', '#fdba74', '#fed7aa', '#422919'),
  pink: accent('#be185d', '#9d174d', '#fdf2f8', '#fbcfe8', '#f9a8d4', '#fbcfe8', '#43233b'),
  slate: accent('#475569', '#334155', '#f8fafc', '#cbd5e1', '#cbd5e1', '#e2e8f0', '#273548'),
};

export const themes: Record<ThemeName, Theme> = { light: lightTheme, dark: darkTheme };

export const webShadow = {
  sm: '0 1px 3px rgba(15, 23, 42, 0.06)',
  md: '0 4px 16px rgba(15, 23, 42, 0.08)',
  lg: '0 8px 24px rgba(15, 23, 42, 0.12)',
} as const;

/** Compatibilidad visual con calendarios guardados antes de la renovación. */
export const legacyCalendarBackgrounds: Readonly<Record<string, string>> = {
  '#dbeafe': colors.primarySoft,
  '#ffedd5': colors.warningSoft,
  '#ffe4e6': colors.dangerSoft,
  '#fef9c3': colors.chartTealSoft,
  '#e0e7ff': colors.infoSoft,
};
