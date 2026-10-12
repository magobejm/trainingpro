import { colors } from '../theme/tokens';

export type FieldBorderState = { disabled?: boolean; error?: null | string; focused?: boolean };

/** Rojo si hay error, azul si está enfocado, neutro en reposo. */
export function resolveFieldBorder(state: FieldBorderState): string {
  if (state.error) return colors.danger;
  if (state.focused && !state.disabled) return colors.primary;
  return colors.borderStrong;
}

export type SelectOption = { label: string; value: string };

/** Siguiente opción al pulsar un Select nativo sin desplegable (circular). */
export function nextSelectValue(options: SelectOption[], current: string): string {
  if (options.length === 0) return current;
  const index = options.findIndex((option) => option.value === current);
  return options[(index + 1) % options.length]?.value ?? current;
}

export function findSelectLabel(options: SelectOption[], value: string, placeholder = ''): string {
  return options.find((option) => option.value === value)?.label ?? placeholder;
}
