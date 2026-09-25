import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { CircularCountdown } from './CircularCountdown';

type RestTimerOverlayProps = {
  endAt: number;
  totalSeconds: number;
  visible: boolean;
  onHide: () => void;
  onFinish: () => void;
};

export function RestTimerOverlay({
  endAt,
  totalSeconds,
  visible,
  onHide,
  onFinish,
}: RestTimerOverlayProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));

  useEffect(() => {
    if (!visible) return;
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
  }, [visible, endAt, onFinish]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.label}>{t('client.today.restTimer')}</Text>
        <CircularCountdown remaining={remaining} size={220} strokeWidth={14} totalSeconds={totalSeconds} />
        <View style={styles.actions}>
          <Pressable style={styles.secondaryBtn} onPress={onHide}>
            <Text style={styles.secondaryText}>{t('mobile.client.rest.hide')}</Text>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={onFinish}>
            <Text style={styles.primaryText}>{t('mobile.client.rest.finishEarly')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
  },
  card: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    gap: 24,
    padding: 32,
    width: '100%',
  },
  label: {
    color: LIGHT.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 14,
  },
  secondaryText: {
    color: LIGHT.accentDark,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.emeraldBg,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 14,
  },
  primaryText: {
    color: LIGHT.textOnNavy,
    fontSize: 14,
    fontWeight: '700',
  },
});
