import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '../theme/tokens';

export type SegmentOption = { label: string; value: string };

export type SegmentedControlProps = {
  accessibilityLabel?: string;
  onChange: (value: string) => void;
  options: SegmentOption[];
  value: string;
};

export function SegmentedControl(props: SegmentedControlProps): React.JSX.Element {
  return (
    <View accessibilityLabel={props.accessibilityLabel} accessibilityRole="tablist" style={styles.row}>
      {props.options.map((option) => {
        const active = option.value === props.value;
        return (
          <Pressable
            accessibilityRole="tab"
            aria-selected={active}
            key={option.value}
            onPress={() => props.onChange(option.value)}
            style={[styles.segment, active ? styles.segmentActive : null]}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.onPrimary,
  },
  row: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
});
