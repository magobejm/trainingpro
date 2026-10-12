import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/tokens';

export type FilterChipItem = {
  id: string;
  label: string;
};

type Props = {
  activeId: string;
  items: FilterChipItem[];
  onSelect: (id: string) => void;
};

const COLORS = {
  activeBg: colors.primary,
  activeText: colors.onPrimary,
  chipBg: colors.surface,
  chipBorder: colors.border,
  text: colors.text,
};

export function FilterChips(props: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      {props.items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => props.onSelect(item.id)}
          style={resolveChipStyle(props.activeId === item.id)}
        >
          <Text style={resolveTextStyle(props.activeId === item.id)}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function resolveChipStyle(active: boolean) {
  return [styles.chip, active ? styles.chipActive : null];
}

function resolveTextStyle(active: boolean) {
  return [styles.label, active ? styles.labelActive : null];
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: COLORS.chipBg,
    borderColor: COLORS.chipBorder,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: COLORS.activeBg,
    borderColor: COLORS.activeBg,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  labelActive: {
    color: COLORS.activeText,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
