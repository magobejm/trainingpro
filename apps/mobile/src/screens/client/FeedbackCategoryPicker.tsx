import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FeedbackCategory } from '../../data/hooks/useClientNotes';
import { LIGHT } from '../../theme/light';

const OPTIONS: FeedbackCategory[] = ['EXERCISE', 'OTHER'];

/** Ejercicio / Otros. There is no default, so the client has to pick one. */
export function FeedbackCategoryPicker(props: {
  onChange: (category: FeedbackCategory) => void;
  value: FeedbackCategory | null;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('mobile.client.feedbackCategory.label')}</Text>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const selected = props.value === option;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={option}
              onPress={() => props.onChange(option)}
              style={[styles.chip, selected ? styles.chipOn : null]}
            >
              <Text style={[styles.chipText, selected ? styles.chipTextOn : null]}>
                {t(`mobile.client.feedbackCategory.${option}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {props.value === null ? <Text style={styles.required}>{t('mobile.client.feedbackCategory.required')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.borderStrong,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  chipOn: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  chipText: { color: LIGHT.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  chipTextOn: { color: LIGHT.textOnNavy },
  label: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '800' },
  required: { color: LIGHT.redBg, fontSize: 11, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  wrap: { gap: 6 },
});
