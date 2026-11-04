import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LIGHT } from '../../theme/light';

export type FeedbackLabel = 'OTHER' | 'REVIEW';

const OPTIONS: FeedbackLabel[] = ['REVIEW', 'OTHER'];

/** Revisión or Otro. Otro starts selected, so a note can be sent without an extra tap. */
export function FeedbackLabelPicker(props: {
  onChange: (label: FeedbackLabel) => void;
  value: FeedbackLabel;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('mobile.client.feedbackLabel.label')}</Text>
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
                {t(`mobile.client.feedbackLabel.${option}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>{t(`mobile.client.feedbackLabel.hint.${props.value}`)}</Text>
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
  hint: { color: LIGHT.textMuted, fontSize: 12 },
  label: { color: LIGHT.textStrong, fontSize: 13, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8 },
  wrap: { gap: 6 },
});
