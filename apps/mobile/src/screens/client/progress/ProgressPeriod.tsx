import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { defaultRange, inferRangePreset, type DateRange } from '@trainerpro/shared';
import { LIGHT } from '../../../theme/light';
import { isValidDateInput } from './exercise-filter';

const NO_CAPS = 'none' as const;
const PRESETS = [
  ['30', 'last30'],
  ['90', 'last90'],
  ['365', 'lastYear'],
  ['730', 'lastTwo'],
  ['all', 'allHistory'],
  ['custom', 'custom'],
] as const;

export function ProgressPeriod(props: {
  range: DateRange;
  onChange: (range: DateRange) => void;
  historyFrom?: string | null;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<string>(() => inferRangePreset(props.range, defaultRange().to, props.historyFrom));
  const [draft, setDraft] = useState(props.range);
  useEffect(() => {
    setDraft(props.range);
    setPreset((cur) => (cur === 'custom' ? cur : inferRangePreset(props.range, defaultRange().to, props.historyFrom)));
  }, [props.range, props.historyFrom]);
  const invalid = !isValidDateInput(draft.from) || !isValidDateInput(draft.to) || draft.from > draft.to;
  const choose = (value: string) => {
    setPreset(value);
    if (value === 'all') props.onChange({ from: props.historyFrom ?? props.range.from, to: defaultRange().to });
    else if (value !== 'custom') props.onChange(defaultRange(Number(value)));
  };
  return (
    <View style={styles.stack}>
      <Text style={styles.label}>{t('progressDashboard.period')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {PRESETS.map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: preset === value }}
            onPress={() => choose(value)}
            style={[styles.chip, preset === value && styles.chipOn]}
          >
            <Text style={[styles.chipText, preset === value && styles.chipTextOn]}>{t(`progressDashboard.${label}`)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {preset === 'custom' ? (
        <View style={styles.stack}>
          <View style={styles.row}>
            <TextInput
              accessibilityLabel={t('progressDashboard.from')}
              autoCapitalize={NO_CAPS}
              onChangeText={(from) => setDraft((cur) => ({ ...cur, from }))}
              placeholder={t('progressDashboard.from')}
              style={styles.input}
              value={draft.from}
            />
            <TextInput
              accessibilityLabel={t('progressDashboard.to')}
              autoCapitalize={NO_CAPS}
              onChangeText={(to) => setDraft((cur) => ({ ...cur, to }))}
              placeholder={t('progressDashboard.to')}
              style={styles.input}
              value={draft.to}
            />
            <Pressable
              disabled={invalid}
              onPress={() => props.onChange(draft)}
              style={[styles.apply, invalid && styles.disabled]}
            >
              <Text style={styles.applyText}>{t('progressDashboard.apply')}</Text>
            </Pressable>
          </View>
          {invalid ? <Text style={styles.error}>{t('progressDashboard.invalidRange')}</Text> : null}
        </View>
      ) : (
        <Text style={styles.muted}>{`${props.range.from} — ${props.range.to}`}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  apply: { backgroundColor: LIGHT.accent, borderRadius: LIGHT.radiusMd, paddingHorizontal: 12, paddingVertical: 10 },
  applyText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  chip: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  chipText: { color: LIGHT.textStrong, fontSize: 12, fontWeight: '700' },
  chipTextOn: { color: '#ffffff' },
  chips: { gap: 6 },
  disabled: { opacity: 0.4 },
  error: { color: LIGHT.error, fontSize: 12 },
  input: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    color: LIGHT.textStrong,
    flex: 1,
    fontSize: 13,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  label: { color: LIGHT.textMuted, fontSize: 12, fontWeight: '700' },
  muted: { color: LIGHT.textMuted, fontSize: 12 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  stack: { gap: 8, width: '100%' },
});
