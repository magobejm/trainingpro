import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'lg' | 'md' | 'sm';

/** Anchos mínimos (px) de cada tamaño: móvil < 640, tablet < 1024, escritorio a partir de ahí. */
export const BREAKPOINTS = { md: 640, lg: 1024 } as const;

export function resolveBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  return 'lg';
}

/** Tamaño de pantalla actual; se actualiza al redimensionar la ventana. */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return resolveBreakpoint(width);
}
