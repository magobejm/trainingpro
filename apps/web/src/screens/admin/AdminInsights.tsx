import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, TextField, colors, fontSize, space } from '@trainerpro/ui';
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
type Billing = { activeClients: number; clientsToNext: number | null; estimatedMonthly: number | null };

type Translate = (key: string, options?: Record<string, unknown>) => string;
const NUMERIC = 'numeric' as const;

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
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState('10');
  const [price, setPrice] = useState('29');
  const query = useQuery({
    enabled: Boolean(accessToken),
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: 'admin' }).get<Billing>(
        '/org/subscription/billing-estimate',
      ),
    queryKey: ['org', 'billing-estimate', accessToken],
  });
  const save = async () => {
    await createApiClient({ accessToken: accessToken ?? '', activeRole: 'admin' }).put('/org/subscription/pricing-tiers', {
      tiers: [{ fromClients: Number(from), monthlyPrice: Number(price), toClients: to ? Number(to) : null }],
    });
    await query.refetch();
  };
  const billing = query.data;
  return (
    <View style={{ gap: space.xs, marginBottom: space.md }}>
      <Text style={{ color: colors.text, fontSize: fontSize.md }}>{props.t('admin.billing.title')}</Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>
        {props.t('admin.billing.estimate', { price: billing?.estimatedMonthly ?? '—' })}
      </Text>
      <TextField keyboardType={NUMERIC} label={props.t('admin.billing.from')} onChangeText={setFrom} value={from} />
      <TextField keyboardType={NUMERIC} label={props.t('admin.billing.to')} onChangeText={setTo} value={to} />
      <TextField keyboardType={NUMERIC} label={props.t('admin.billing.price')} onChangeText={setPrice} value={price} />
      <Button label={props.t('admin.billing.save')} onPress={() => void save()} />
    </View>
  );
}
