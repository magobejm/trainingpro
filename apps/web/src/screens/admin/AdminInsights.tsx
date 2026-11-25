import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import { createApiClient } from '../../data/api-client';
import { useAuthStore } from '../../store/auth.store';

type CoachMetric = {
  activeClients: number | null;
  adherencePercent: number | null;
  archivedClients: number | null;
  coachEmail: string;
  incidentResponseHours: number | null;
};
type Metrics = { coaches: CoachMetric[] };
type Billing = {
  activeClients: number;
  billableMonthly: number;
  clientLimit: number;
  estimatedMonthly: number;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function CoachMetricsCard(props: { t: Translate }): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.accessToken);
  const query = useQuery({
    enabled: Boolean(accessToken),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: 'admin' }).get<Metrics>('/org/coaches/metrics'),
    queryKey: ['org', 'coach-metrics', accessToken],
  });
  return (
    <View style={{ gap: space.xs, marginBottom: space.md }}>
      <Text style={{ color: colors.text, fontSize: fontSize.md }}>{props.t('admin.metrics.title')}</Text>
      {query.data?.coaches.map((coach) => (
        <Text key={coach.coachEmail} style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
          {props.t('admin.metrics.row', {
            active: coach.activeClients ?? props.t('admin.metrics.hidden'),
            adherence: coach.adherencePercent ?? '—',
            email: coach.coachEmail,
          })}
        </Text>
      ))}
    </View>
  );
}

export function BillingEstimateCard(props: { t: Translate }): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.accessToken);
  const query = useQuery({
    enabled: Boolean(accessToken),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: 'admin' }).get<Billing>(
        '/org/subscription/billing-estimate',
      ),
    queryKey: ['org', 'billing-estimate', accessToken],
  });
  const billing = query.data;
  const currency = props.t('admin.billing.currency');
  return (
    <View style={billingStyles.card}>
      <Text style={billingStyles.title}>{props.t('admin.billing.title')}</Text>
      <Text style={billingStyles.subtitle}>{props.t('admin.billing.subtitle')}</Text>
      <View style={billingStyles.row}>
        <PriceTile
          amount={billing?.estimatedMonthly}
          currency={currency}
          hint={billing ? props.t('admin.billing.estimateHint', { count: billing.clientLimit }) : '—'}
          label={props.t('admin.billing.estimateLabel')}
          tone="estimate"
        />
        <PriceTile
          amount={billing?.billableMonthly}
          currency={currency}
          hint={billing ? props.t('admin.billing.billableHint', { count: billing.activeClients }) : '—'}
          label={props.t('admin.billing.billableLabel')}
          tone="billable"
        />
      </View>
    </View>
  );
}

function PriceTile(props: {
  amount: number | undefined;
  currency: string;
  hint: string;
  label: string;
  tone: 'billable' | 'estimate';
}): React.JSX.Element {
  const ready = props.amount !== undefined;
  const amount = ready ? String(props.amount) : '—';
  return (
    <View
      accessibilityLabel={`${props.label}: ${amount} ${props.currency}. ${props.hint}`}
      style={[billingStyles.tile, props.tone === 'billable' ? billingStyles.tileBillable : billingStyles.tileEstimate]}
    >
      <Text style={billingStyles.tileLabel}>{props.label}</Text>
      <View style={billingStyles.amountRow}>
        <Text style={[billingStyles.amount, props.tone === 'billable' && billingStyles.amountBillable]}>{amount}</Text>
        <Text style={billingStyles.currency}>{props.currency}</Text>
      </View>
      <Text style={billingStyles.tileHint}>{props.hint}</Text>
    </View>
  );
}

const billingStyles = StyleSheet.create({
  amount: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    lineHeight: 40,
  },
  amountBillable: {
    color: colors.primary,
  },
  amountRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: space.xs,
    marginTop: space.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.xl,
    width: '100%',
  },
  currency: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.xs,
  },
  tile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexBasis: 220,
    flexGrow: 1,
    padding: space.lg,
  },
  tileBillable: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  tileEstimate: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  tileHint: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: space.sm,
  },
  tileLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
});
