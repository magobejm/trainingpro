import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { radius } from '../theme/tokens';
import { resolveIconButtonColors, type IconButtonTone } from './button.logic';

export type IconButtonProps = {
  /** Obligatoria: un botón solo con icono debe poder leerse con un lector de pantalla. */
  accessibilityLabel: string;
  disabled?: boolean;
  /** Recibe el color del icono según el estado (hover/pulsado). */
  icon: (color: string) => React.ReactNode;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  tone?: IconButtonTone;
};

type HoverState = { hovered?: boolean; pressed?: boolean };

export function IconButton(props: IconButtonProps): React.JSX.Element {
  const { size = 32, tone = 'neutral' } = props;
  return (
    <Pressable
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole="button"
      aria-disabled={Boolean(props.disabled)}
      disabled={props.disabled}
      onPress={props.onPress}
      style={(state) => {
        const colorsNow = resolveIconButtonColors(tone, { ...(state as HoverState), disabled: props.disabled });
        return [
          styles.base,
          { backgroundColor: colorsNow.background, height: size, width: size },
          props.disabled ? styles.disabled : null,
          props.style,
        ];
      }}
      testID={props.testID}
    >
      {(state) => props.icon(resolveIconButtonColors(tone, { ...(state as HoverState), disabled: props.disabled }).icon)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
