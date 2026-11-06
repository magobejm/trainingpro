import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HEALTH_ACCESS_LABEL, type HealthAccess } from './health-access';
import { readHealthAccess, readHealthSnapshot, requestHealthAccess, revokeHealthAccess } from './index';
import { todayHealthLines, type TodayHealthLine } from './today-health';
import { s } from '../shell/client/client-shell.styles';

export function HealthConnectRow(): React.JSX.Element {
  const { t } = useTranslation();
  const [access, setAccess] = useState<HealthAccess>('unavailable');
  const [notice, setNotice] = useState('');
  const [lines, setLines] = useState<TodayHealthLine[]>([]);
  const refresh = (): void => {
    void loadHealth(setAccess, setLines);
  };
  useEffect(refresh, [t]);
  return (
    <View>
      <Pressable
        onPress={() => void requestHealthAccess().then(refresh)}
        style={({ pressed }) => [s.moreItem, pressed && { opacity: 0.9 }]}
      >
        <View style={s.moreItemLeft}>
          <View style={s.moreItemIcon}>
            <Text style={{ fontSize: 22 }}>{'♡'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.moreItemLabel}>{t('mobile.client.health.connect')}</Text>
            <Text style={hint}>{t(HEALTH_ACCESS_LABEL[access])}</Text>
            {lines.map((line) => (
              <Text key={line.id} style={hint}>
                {t(line.key, line.values)}
              </Text>
            ))}
            {access === 'connected' && lines.length === 0 ? (
              <Text style={hint}>{t('mobile.client.health.emptyToday')}</Text>
            ) : null}
            {notice ? <Text style={hint}>{notice}</Text> : null}
          </View>
        </View>
      </Pressable>
      {access === 'connected' ? (
        <Pressable
          onPress={() => void disconnect(setNotice, t, refresh)}
          style={({ pressed }) => [s.moreItem, pressed && { opacity: 0.9 }]}
        >
          <Text style={s.moreItemLabel}>{t('mobile.client.health.disconnect')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const hint = { color: '#93c5fd', marginTop: 4 };

async function loadHealth(
  setAccess: (value: HealthAccess) => void,
  setLines: (value: TodayHealthLine[]) => void,
): Promise<void> {
  const next = await readHealthAccess();
  setAccess(next);
  if (next !== 'connected') {
    setLines([]);
    return;
  }
  setLines(todayHealthLines(await readHealthSnapshot()));
}

async function disconnect(
  setNotice: (value: string) => void,
  t: (key: string) => string,
  refresh: () => void,
): Promise<void> {
  const result = await revokeHealthAccess();
  setNotice(result === 'pending' ? t('mobile.client.health.pending') : '');
  refresh();
}
