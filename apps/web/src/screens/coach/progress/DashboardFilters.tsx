import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, DateTimeField, Select } from '@trainerpro/ui';
import { dashboardStyles as styles } from './dashboard.styles';
import { defaultRange, inferRangePreset } from './dashboard-model';
import type { DateRange } from './progress-screen.types';

export function DashboardRange(props: {
  range: DateRange;
  onChange: (range: DateRange) => void;
  historyFrom?: string | null;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [preset, setPreset] = useState(() => inferRangePreset(props.range, defaultRange().to, props.historyFrom));
  const [draft, setDraft] = useState(props.range);
  useEffect(() => {
    setDraft(props.range);
    setPreset((current) =>
      current === 'custom' ? current : inferRangePreset(props.range, defaultRange().to, props.historyFrom),
    );
  }, [props.range, props.historyFrom]);
  const invalid = !draft.from || !draft.to || draft.from > draft.to;
  const options = (
    [
      ['30', 'last30'],
      ['90', 'last90'],
      ['365', 'lastYear'],
      ['730', 'lastTwo'],
      ['all', 'allHistory'],
      ['custom', 'custom'],
    ] as const
  ).map(([value, label]) => ({ value, label: t(`progressDashboard.${label}`) }));
  return (
    <View style={styles.column}>
      <Select
        label={t('progressDashboard.period')}
        options={options}
        value={preset}
        onChange={(value) => {
          setPreset(value);
          if (value === 'all') props.onChange({ from: props.historyFrom ?? props.range.from, to: defaultRange().to });
          else if (value !== 'custom') props.onChange(defaultRange(Number(value)));
        }}
      />
      {preset === 'custom' ? (
        <>
          <View style={styles.row}>
            <DateTimeField
              type={'date'}
              label={t('progressDashboard.from')}
              value={draft.from}
              onChange={(from) => setDraft((current) => ({ ...current, from }))}
              max={draft.to}
            />
            <DateTimeField
              type={'date'}
              label={t('progressDashboard.to')}
              value={draft.to}
              onChange={(to) => setDraft((current) => ({ ...current, to }))}
              min={draft.from}
            />
            <Button
              label={t('progressDashboard.apply')}
              onPress={() => !invalid && props.onChange(draft)}
              disabled={invalid}
            />
          </View>
          {invalid ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {t('progressDashboard.invalidRange')}
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.muted}>{`${props.range.from} — ${props.range.to}`}</Text>
      )}
    </View>
  );
}

export function DashboardPager(props: { page: number; count: number; size: number; onChange: (page: number) => void }) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(props.count / props.size));
  if (pages <= 1) return null;
  return (
    <View style={styles.row}>
      <Button
        label={t('progressDashboard.previous')}
        disabled={props.page === 0}
        onPress={() => props.onChange(props.page - 1)}
        variant="secondary"
        size="sm"
      />
      <Text style={styles.muted}>{t('progressDashboard.page', { page: props.page + 1, pages })}</Text>
      <Button
        label={t('progressDashboard.next')}
        disabled={props.page >= pages - 1}
        onPress={() => props.onChange(props.page + 1)}
        variant="secondary"
        size="sm"
      />
    </View>
  );
}
