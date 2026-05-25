import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientCalendarSummary } from '../../data/hooks/useClientCalendar';

type KpiItemProps = {
  label: string;
  value: string;
};

function KpiItem({ label, value }: KpiItemProps): React.JSX.Element {
  return (
    <View style={styles.item}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

type KpiStripProps = {
  data: ClientCalendarSummary;
};

export function KpiStrip({ data }: KpiStripProps): React.JSX.Element {
  const { t } = useTranslation();
  const motivation = data.avgMotivation !== null ? data.avgMotivation.toFixed(1) : '—';
  return (
    <View style={styles.container}>
      <KpiItem label={t('client.calendar.kpi.completed')} value={String(data.completedDays)} />
      <KpiItem label={t('client.calendar.kpi.streak')} value={String(data.currentStreakWeeks)} />
      <KpiItem label={t('client.calendar.kpi.motivation')} value={motivation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
  },
  item: { alignItems: 'center' },
  label: { color: 'rgba(196,181,253,0.7)', fontSize: 11, marginTop: 2, textAlign: 'center' },
  value: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
});
