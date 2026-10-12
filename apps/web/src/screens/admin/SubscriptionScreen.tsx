import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useOrgSubscriptionOccupancyQuery, useUpdateOrgClientLimitMutation } from '../../data/hooks/useOrgSubscription';
import { Button, EmptyState, TextField, colors, fontSize, radius, space, useToast } from '@trainerpro/ui';

const COLORS = {
  action: colors.primary,
  border: colors.border,
  card: colors.surface,
  danger: colors.danger,
  page: colors.background,
  text: colors.text,
  textMuted: colors.textMuted,
};

const LIMIT_INPUT_PROPS = {
  keyboardType: 'numeric' as const,
};

export function SubscriptionScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const occupancyQuery = useOrgSubscriptionOccupancyQuery();
  const updateLimit = useUpdateOrgClientLimitMutation();
  const toast = useToast();
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
    updateLimit.mutate(parsed, { onSuccess: () => toast.success(t('admin.subscription.saved')) });
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
        <EmptyState title={t('admin.subscription.error')} />
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
        <TextField
          {...LIMIT_INPUT_PROPS}
          containerStyle={styles.input}
          disabled={updateLimit.isPending}
          error={invalidLimit ? t('admin.subscription.invalidLimit') : null}
          label={t('admin.subscription.limit.label')}
          onChangeText={onChangeLimit}
          placeholder={t('admin.subscription.limit.placeholder')}
          value={limitDraft}
        />
        {updateLimit.isError ? <Text style={styles.errorInline}>{t('admin.subscription.saveError')}</Text> : null}
        <Button label={t('admin.subscription.limit.save')} loading={updateLimit.isPending} onPress={onSave} />
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
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 760,
    padding: space.xl,
    width: '100%',
  },
  centered: {
    gap: space.md,
    justifyContent: 'center',
  },
  errorInline: {
    color: COLORS.danger,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: space.md,
  },
  input: {
    marginBottom: space.lg,
    marginTop: space.lg,
  },
  metricCard: {
    backgroundColor: COLORS.page,
    borderRadius: radius.lg,
    flex: 1,
    padding: space.lg,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
    marginBottom: space.sm,
  },
  metricRow: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  muted: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.page,
    flex: 1,
    padding: space.xl,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.xs,
  },
  title: {
    color: COLORS.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
});
