import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { healthStatus, requestHealthAccess } from './index';
import { s } from '../shell/client/client-shell.styles';

export function HealthConnectRow(): React.JSX.Element {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  return (
    <Pressable
      onPress={() => {
        void requestHealthAccess().then(async (granted) => {
          const available = await healthStatus();
          const unavailable = available === 'unavailable' || !granted;
          const key = unavailable ? 'mobile.client.health.unavailable' : 'mobile.client.health.connected';
          setStatus(t(key));
        });
      }}
      style={({ pressed }) => [s.moreItem, pressed && { opacity: 0.9 }]}
    >
      <View style={s.moreItemLeft}>
        <View style={s.moreItemIcon}>
          <Text style={{ fontSize: 22 }}>{'♡'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moreItemLabel}>{t('mobile.client.health.connect')}</Text>
          {status ? <Text style={{ color: '#93c5fd', marginTop: 4 }}>{status}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}
