import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';

const COLORS = {
  action: '#1d5fd4',
  border: '#dbe5f2',
  card: '#ffffff',
  page: '#eef3fa',
  text: '#132238',
  textMuted: '#64748b',
};

const LIMIT_INPUT_PROPS = {
  keyboardType: 'numeric' as const,
};

export function SubscriptionScreen(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('admin.subscription.title')}</Text>
        <Text style={styles.subtitle}>{t('admin.subscription.subtitle')}</Text>
        <View style={styles.metricRow}>
          <MetricCard label={t('admin.subscription.current')} value={t('admin.subscription.mock.current')} />
          <MetricCard label={t('admin.subscription.max')} value={t('admin.subscription.mock.max')} />
        </View>
        <Text style={styles.inputLabel}>{t('admin.subscription.limit.label')}</Text>
        <TextInput
          {...LIMIT_INPUT_PROPS}
          placeholder={t('admin.subscription.limit.placeholder')}
          style={styles.input}
        />
        <Pressable style={styles.button}>
          <Text style={styles.buttonLabel}>{t('admin.subscription.limit.save')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard(props: MetricCardProps): React.JSX.Element {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 42,
  },
  buttonLabel: {
    color: COLORS.card,
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 760,
    padding: 22,
    width: '100%',
  },
  input: {
    borderColor: COLORS.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
  },
  metricCard: {
    backgroundColor: COLORS.page,
    borderRadius: 12,
    flex: 1,
    padding: 14,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.page,
    flex: 1,
    padding: 24,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
});
