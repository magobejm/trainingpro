import { QueryResult } from '../../components/AsyncStatus';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { useOrgSubscriptionOccupancyQuery, useUpdateOrgClientLimitMutation } from '../../data/hooks/useOrgSubscription';
import { Button, SkeletonList, TextField, colors, fontSize, radius, space, useToast } from '@trainerpro/ui';
import { BillingEstimateCard } from './AdminInsights';

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
    updateLimit.mutate(parsed, {
      onSuccess: () => toast.success(t('admin.subscription.saved')),
      onError: () => toast.error(t('common.mutationError')),
    });
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
        <View accessibilityLabel={t('admin.subscription.loading')} accessibilityRole="progressbar">
          <SkeletonList variant="panel" />
        </View>
      </View>
    );
  }

  if (occupancyQuery.isError) {
    return (
      <View style={[styles.page, styles.centered]}>
        <QueryResult
          emptyTitle={t('admin.subscription.error')}
          error={occupancyQuery.error}
          isError
          isLoading={false}
          itemCount={0}
          onRetry={() => void occupancyQuery.refetch()}
        />
      </View>
    );
  }

  const occupancy = occupancyQuery.data;
  const activeCount = occupancy?.activeClientCount ?? 0;
  const currentLimit = occupancy?.clientLimit ?? 0;

  return (
    <View style={styles.page}>
      <BillingEstimateCard t={t} />
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: space.md,
  },
  input: {
    marginBottom: space.lg,
    marginTop: space.lg,
  },
  metricCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    flex: 1,
    padding: space.lg,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: space.sm,
  },
  metricRow: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },
  metricValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  muted: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  page: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    padding: space.xl,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
});
