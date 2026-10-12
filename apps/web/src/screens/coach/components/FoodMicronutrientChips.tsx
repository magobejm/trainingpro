import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MICRONUTRIENT_KEYS, parseMicronutrients, toggleMicronutrient } from '../foods.helpers';
import { colors, fontSize, space } from '@trainerpro/ui';

type Props = {
  selected: string;
  setField: (field: string) => (value: string) => void;
  t: (key: string) => string;
};

export function FoodMicronutrientChips(props: Props): React.JSX.Element {
  const selected = parseMicronutrients(props.selected);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{props.t('coach.library.foods.micronutrientsLabel')}</Text>
      <View style={styles.row}>
        {MICRONUTRIENT_KEYS.map((id) => {
          const active = selected.includes(id);
          return (
            <Pressable
              key={id}
              onPress={() => props.setField('micronutrients')(toggleMicronutrient(props.selected, id))}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>
                {props.t(`coach.library.foods.micronutrients.${id}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.surface,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  wrap: {
    gap: space.sm,
  },
});
