import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, TextField, colors, fontSize, space } from '@trainerpro/ui';
import { createApiClient } from '../../data/api-client';
import { useClientMeasurementsQuery, type ClientMeasurementView } from '../../data/hooks/useClientsQuery';
import { useAuthStore } from '../../store/auth.store';
import { styles as profileStyles } from './ClientProfileEditScreen.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;
const DAY_KEY = 'day';
const WEIGHT_KEY = 'weight';
const MONOTONE = 'monotone' as const;
const FULL = '100%';

export function MeasurementTools(props: { clientId: string; t: Translate }): React.JSX.Element {
  const query = useClientMeasurementsQuery(props.clientId);
  const items = query.data ?? [];
  return (
    <View style={profileStyles.card}>
      <Text style={profileStyles.label}>{props.t('coach.measurements.chart')}</Text>
      <WeightChart items={items} />
      <MeasurementForm clientId={props.clientId} t={props.t} />
    </View>
  );
}

function WeightChart(props: { items: ClientMeasurementView[] }): React.JSX.Element | null {
  const points = props.items
    .filter((item) => item.weightKg != null)
    .map((item) => ({ day: (item.measuredAt ?? item.createdAt).slice(0, 10), weight: item.weightKg }));
  if (points.length < 2) return null;
  return (
    <View style={{ height: 180 }}>
      <ResponsiveContainer height={FULL} width={FULL}>
        <LineChart data={points}>
          <CartesianGrid stroke={colors.border} />
          <XAxis dataKey={DAY_KEY} />
          <YAxis />
          <Tooltip />
          <Line dataKey={WEIGHT_KEY} stroke={colors.chartPurple} type={MONOTONE} />
        </LineChart>
      </ResponsiveContainer>
    </View>
  );
}

function MeasurementForm(props: { clientId: string; t: Translate }): React.JSX.Element {
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  const [error, setError] = useState(false);
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const save = async () => {
    setError(false);
    try {
      await createApiClient({ accessToken: accessToken ?? '', activeRole: 'coach' }).post(
        `/clients/${props.clientId}/measurements`,
        {
          measuredAt: new Date(when).toISOString(),
          waistCm: waist ? Number(waist) : null,
          weightKg: weight ? Number(weight) : null,
        },
      );
      setWeight('');
      setWaist('');
      await queryClient.invalidateQueries({ queryKey: ['clients', 'measurements', props.clientId] });
    } catch {
      setError(true);
    }
  };
  return (
    <View style={{ gap: space.sm, marginTop: space.md }}>
      <TextField label={props.t('coach.measurements.date')} onChangeText={setWhen} value={when} />
      <TextField
        keyboardType={NUMERIC}
        label={props.t('coach.measurements.weight')}
        onChangeText={setWeight}
        value={weight}
      />
      <TextField keyboardType={NUMERIC} label={props.t('coach.measurements.waist')} onChangeText={setWaist} value={waist} />
      <Button label={props.t('coach.measurements.save')} onPress={() => void save()} />
      {error ? (
        <Text style={{ color: colors.danger, fontSize: fontSize.sm }}>{props.t('coach.measurements.error')}</Text>
      ) : null}
    </View>
  );
}

const NUMERIC = 'numeric' as const;

export function ClientIntakeStatus(props: { clientId: string; t: Translate }): React.JSX.Element | null {
  const accessToken = useAuthStore((state) => state.accessToken);
  const query = useQuery({
    enabled: Boolean(accessToken) && props.clientId.length > 0,
    queryFn: () =>
      createApiClient({ accessToken: accessToken ?? '', activeRole: 'coach' }).get<{ status?: string } | null>(
        `/clients/${props.clientId}/intake`,
      ),
    queryKey: ['clients', 'intake', props.clientId, accessToken],
  });
  if (!query.data?.status) return null;
  const key = query.data.status === 'COMPLETED' ? 'coach.intake.completed' : 'coach.intake.pending';
  return <Text style={profileStyles.helperText}>{props.t(key)}</Text>;
}
