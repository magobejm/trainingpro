import { colors } from '../theme/tokens';

export type ButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary';

export type ButtonTone = { background: string; border: string; text: string };

export type InteractionState = { disabled?: boolean; hovered?: boolean; pressed?: boolean };

const TONES: Record<ButtonVariant, { base: ButtonTone; hover: ButtonTone }> = {
  danger: {
    base: { background: colors.danger, border: colors.danger, text: colors.onPrimary },
    hover: { background: colors.dangerHover, border: colors.dangerHover, text: colors.onPrimary },
  },
  ghost: {
    base: { background: 'transparent', border: 'transparent', text: colors.primary },
    hover: { background: colors.primarySoft, border: colors.primarySoft, text: colors.primaryHover },
  },
  primary: {
    base: { background: colors.primary, border: colors.primary, text: colors.onPrimary },
    hover: { background: colors.primaryHover, border: colors.primaryHover, text: colors.onPrimary },
  },
  secondary: {
    base: { background: colors.surface, border: colors.borderStrong, text: colors.text },
    hover: { background: colors.surfaceMuted, border: colors.borderStrong, text: colors.text },
  },
};

export function resolveButtonTone(variant: ButtonVariant, state: InteractionState = {}): ButtonTone {
  const tones = TONES[variant];
  if (state.disabled) return tones.base;
  return state.hovered || state.pressed ? tones.hover : tones.base;
}

/** Un botón cargando o deshabilitado no responde a pulsaciones (evita dobles envíos). */
export function isButtonInactive(props: { disabled?: boolean; loading?: boolean }): boolean {
  return Boolean(props.disabled || props.loading);
}

export type IconButtonTone = 'danger' | 'neutral';

export function resolveIconButtonColors(
  tone: IconButtonTone,
  state: InteractionState = {},
): { background: string; icon: string } {
  const active = !state.disabled && (state.hovered || state.pressed);
  if (tone === 'danger') {
    return { background: active ? colors.danger : colors.dangerSoft, icon: active ? colors.onPrimary : colors.danger };
  }
  return { background: active ? colors.border : colors.surfaceMuted, icon: colors.textMuted };
}
