import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { formatRestLabel } from './session-completion.utils';

type MiniRestTimerProps = {
  endAt: number;
  onPress: () => void;
  onFinish: () => void;
};

export function MiniRestTimer({ endAt, onPress, onFinish }: MiniRestTimerProps): React.JSX.Element {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));

  useEffect(() => {
    const tick = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) {
        onFinish();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endAt, onFinish]);

  return (
    <Pressable style={styles.bar} onPress={onPress}>
      <Text style={styles.icon}>{'⏱'}</Text>
      <Text style={styles.label}>{t('client.today.restTimer')}</Text>
      <Text style={styles.time}>{formatRestLabel(remaining)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: LIGHT.emeraldSoft,
    borderColor: LIGHT.emerald,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    color: LIGHT.success,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    color: LIGHT.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
});
