import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { useOrgSubscriptionOccupancyQuery, useUpdateOrgClientLimitMutation } from '../../data/hooks/useOrgSubscription';

const COLORS = {
  action: '#1d5fd4',
  border: '#dbe5f2',
  card: '#ffffff',
  danger: '#b42318',
  page: '#eef3fa',
  text: '#132238',
  textMuted: '#64748b',
};

const LIMIT_INPUT_PROPS = {
  keyboardType: 'numeric' as const,
};

export function SubscriptionScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const occupancyQuery = useOrgSubscriptionOccupancyQuery();
  const updateLimit = useUpdateOrgClientLimitMutation();
  const [limitDraft, setLimitDraft] = useState('');
  const [invalidLimit, setInvalidLimit] = useState(false);

  useEffect(() => {
    if (occupancyQuery.data) {
      setLimitDraft(String(occupancyQuery.data.clientLimit));
    }
  }, [occupancyQuery.data?.clientLimit, occupancyQuery.data?.organizationId]);

  const onSave = () => {
    setInvalidLimit(false);
    const parsed = Number.parseInt(limitDraft.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setInvalidLimit(true);
      return;
    }
    updateLimit.mutate(parsed);
  };

  const onChangeLimit = (text: string) => {
    setInvalidLimit(false);
    if (updateLimit.isError) {
      updateLimit.reset();
    }
    setLimitDraft(text);
  };

  if (occupancyQuery.isPending) {
    return (
      <View style={[styles.page, styles.centered]}>
        <ActivityIndicator color={COLORS.action} size={'large'} />
        <Text style={styles.muted}>{t('admin.subscription.loading')}</Text>
      </View>
    );
  }

  if (occupancyQuery.isError) {
    return (
      <View style={[styles.page, styles.centered]}>
        <Text style={styles.error}>{t('admin.subscription.error')}</Text>
      </View>
    );
  }

  const occupancy = occupancyQuery.data;
  const activeCount = occupancy?.activeClientCount ?? 0;
  const currentLimit = occupancy?.clientLimit ?? 0;

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('admin.subscription.title')}</Text>
        <Text style={styles.subtitle}>{t('admin.subscription.subtitle')}</Text>
        <View style={styles.metricRow}>
          <MetricCard label={t('admin.subscription.current')} value={String(activeCount)} />
          <MetricCard label={t('admin.subscription.max')} value={String(currentLimit)} />
        </View>
        <Text style={styles.inputLabel}>{t('admin.subscription.limit.label')}</Text>
        <TextInput
          {...LIMIT_INPUT_PROPS}
          editable={!updateLimit.isPending}
          onChangeText={onChangeLimit}
          placeholder={t('admin.subscription.limit.placeholder')}
          style={styles.input}
          value={limitDraft}
        />
        {invalidLimit ? <Text style={styles.errorInline}>{t('admin.subscription.invalidLimit')}</Text> : null}
        {updateLimit.isError ? <Text style={styles.errorInline}>{t('admin.subscription.saveError')}</Text> : null}
        <Pressable
          disabled={updateLimit.isPending}
          onPress={onSave}
          style={[styles.button, updateLimit.isPending && styles.buttonDisabled]}
        >
          {updateLimit.isPending ? (
            <ActivityIndicator color={COLORS.card} />
          ) : (
            <Text style={styles.buttonLabel}>{t('admin.subscription.limit.save')}</Text>
          )}
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
  buttonDisabled: {
    opacity: 0.7,
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
  centered: {
    gap: 12,
    justifyContent: 'center',
  },
  error: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorInline: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
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
  muted: {
    color: COLORS.textMuted,
    fontSize: 14,
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
