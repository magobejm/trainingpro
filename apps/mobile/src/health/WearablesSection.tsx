import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, Text, View, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createApiClient } from '../data/api-client';
import { useAuthStore } from '../store/auth.store';
import { s } from '../shell/client/client-shell.styles';
import { readHealthSnapshot } from './index';
import { readWearableReturn } from './wearable-return';
import { linkedCloudProviders, type CloudProvider, type SavedConnection } from './wearable-links';

const PROVIDERS: readonly CloudProvider[] = ['garmin', 'polar', 'strava'];
let handledReturnUrl = '';

export function WearablesSection(): React.JSX.Element {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [linked, setLinked] = useState<ReadonlySet<CloudProvider>>(new Set());
  const [notice, setNotice] = useState('');
  const refresh = useCallback(() => {
    void loadLinks(accessToken).then((next) => {
      if (next) setLinked(next);
    });
  }, [accessToken]);
  useEffect(() => {
    refresh();
    const apply = (url: string | null) => {
      const result = url ? readWearableReturn(url) : null;
      if (!url || !result || url === handledReturnUrl) return;
      handledReturnUrl = url;
      setNotice(result.status === 'ok' ? '' : t('mobile.client.wearables.rejected'));
      refresh();
    };
    const links = Linking.addEventListener('url', (event) => apply(event.url));
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    void Linking.getInitialURL().then(apply);
    return () => {
      links.remove();
      app.remove();
    };
  }, [refresh, t]);
  return (
    <View>
      <Text style={s.moreItemLabel}>{t('mobile.client.wearables.consent')}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void syncDay(accessToken, setNotice, t)}
        style={({ pressed }) => [s.moreItem, pressed && { opacity: 0.9 }]}
      >
        <Text style={s.moreItemLabel}>{t('mobile.client.wearables.sync')}</Text>
      </Pressable>
      {PROVIDERS.map((provider) => (
        <ProviderRow
          connected={linked.has(provider)}
          key={provider}
          name={t(`mobile.client.wearables.${provider}`)}
          onConnect={() => void connect(provider, accessToken, setNotice, t)}
          onDisconnect={() => void disconnect(provider, accessToken, setNotice, t, refresh)}
          t={t}
        />
      ))}
      {notice ? <Text style={s.moreItemLabel}>{notice}</Text> : null}
    </View>
  );
}

function ProviderRow(props: {
  connected: boolean;
  name: string;
  onConnect: () => void;
  onDisconnect: () => void;
  t: (key: string, values?: Record<string, string>) => string;
}): React.JSX.Element {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        onPress={props.connected ? undefined : props.onConnect}
        style={({ pressed }) => [s.moreItem, pressed && !props.connected && { opacity: 0.9 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.moreItemLabel}>{props.name}</Text>
          <Text style={hint}>
            {props.t(props.connected ? 'mobile.client.link.connected' : 'mobile.client.link.disconnected')}
          </Text>
        </View>
      </Pressable>
      {props.connected ? (
        <Pressable
          accessibilityRole="button"
          onPress={props.onDisconnect}
          style={({ pressed }) => [s.moreItem, pressed && { opacity: 0.9 }]}
        >
          <Text style={s.moreItemLabel}>{props.t('mobile.client.link.disconnect', { name: props.name })}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const hint = { color: '#93c5fd', marginTop: 4 };

async function loadLinks(accessToken: string | null): Promise<ReadonlySet<CloudProvider> | null> {
  if (!accessToken) return new Set();
  try {
    const result = await createApiClient({ accessToken, activeRole: 'client' }).get<{ connections: SavedConnection[] }>(
      '/clients/me/integrations',
    );
    return linkedCloudProviders(result.connections);
  } catch {
    return null;
  }
}

async function syncDay(
  accessToken: string | null,
  setNotice: (value: string) => void,
  t: (key: string) => string,
): Promise<void> {
  let snapshot;
  try {
    snapshot = await readHealthSnapshot();
  } catch {
    setNotice(t('mobile.client.health.denied'));
    return;
  }
  if (!accessToken || !snapshot) {
    setNotice(t('mobile.client.health.unavailable'));
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
    setNotice(t('mobile.client.wearables.synced'));
  } catch {
    setNotice(t('mobile.client.wearables.retry'));
  }
}

async function connect(
  provider: CloudProvider,
  accessToken: string | null,
  setNotice: (value: string) => void,
  t: (key: string) => string,
): Promise<void> {
  if (!accessToken) return;
  try {
    const result = await createApiClient({ accessToken, activeRole: 'client' }).post<{ url: string }>(
      `/clients/me/integrations/${provider}/authorize`,
      {},
    );
    if (!result.url) {
      setNotice(t('mobile.client.wearables.unconfigured'));
      return;
    }
    await Linking.openURL(result.url);
  } catch {
    setNotice(t('mobile.client.wearables.unconfigured'));
  }
}

async function disconnect(
  provider: CloudProvider,
  accessToken: string | null,
  setNotice: (value: string) => void,
  t: (key: string) => string,
  refresh: () => void,
): Promise<void> {
  if (!accessToken) return;
  try {
    await createApiClient({ accessToken, activeRole: 'client' }).delete(`/clients/me/integrations/${provider}`);
    setNotice('');
    refresh();
  } catch {
    setNotice(t('mobile.client.link.disconnectFailed'));
  }
}
