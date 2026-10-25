import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createApiClient } from '../data/api-client';
import { useAuthStore } from '../store/auth.store';
import { s } from '../shell/client/client-shell.styles';
import { readHealthSnapshot } from './index';

const PROVIDERS = ['garmin', 'polar', 'strava'] as const;

export function WearablesSection(): React.JSX.Element {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [status, setStatus] = useState('');
  return (
    <View>
      <Text style={s.moreItemLabel}>{t('mobile.client.wearables.consent')}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void syncDay(accessToken, setStatus, t)}
        style={({ pressed }) => [s.moreItem, pressed && { opacity: 0.9 }]}
      >
        <Text style={s.moreItemLabel}>{t('mobile.client.wearables.sync')}</Text>
      </Pressable>
      {PROVIDERS.map((provider) => (
        <Pressable
          accessibilityRole="button"
          key={provider}
          onPress={() => void connect(provider, accessToken, setStatus, t)}
          style={({ pressed }) => [s.moreItem, pressed && { opacity: 0.9 }]}
        >
          <Text style={s.moreItemLabel}>{provider}</Text>
        </Pressable>
      ))}
      {status ? <Text style={s.moreItemLabel}>{status}</Text> : null}
    </View>
  );
}

async function syncDay(
  accessToken: string | null,
  setStatus: (value: string) => void,
  t: (key: string) => string,
): Promise<void> {
  const snapshot = await readHealthSnapshot();
  if (!accessToken || !snapshot) {
    setStatus(t('mobile.client.health.unavailable'));
    return;
  }
  const source = Platform.OS === 'ios' ? 'HEALTHKIT' : 'HEALTH_CONNECT';
  try {
    await createApiClient({ accessToken, activeRole: 'client' }).post('/clients/me/health/daily', {
      days: [
        {
          activeKcal: snapshot.activeKcal ?? null,
          date: new Date().toISOString().slice(0, 10),
          hrvMs: snapshot.hrvMs ?? null,
          restingHr: snapshot.restingHr ?? null,
          sleepMinutes: snapshot.sleepHours == null ? null : Math.round(snapshot.sleepHours * 60),
          steps: snapshot.steps,
          weightKg: snapshot.weightKg,
        },
      ],
      source,
    });
    setStatus(t('mobile.client.wearables.synced'));
  } catch {
    setStatus(t('mobile.client.wearables.retry'));
  }
}

async function connect(
  provider: (typeof PROVIDERS)[number],
  accessToken: string | null,
  setStatus: (value: string) => void,
  t: (key: string) => string,
): Promise<void> {
  if (!accessToken) return;
  try {
    await createApiClient({ accessToken, activeRole: 'client' }).post(`/clients/me/integrations/${provider}/authorize`, {});
  } catch {
    setStatus(t('mobile.client.wearables.unconfigured'));
  }
}
