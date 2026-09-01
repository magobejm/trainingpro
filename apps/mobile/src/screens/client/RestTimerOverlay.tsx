import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { formatRestLabel } from './session-completion.utils';

type RestTimerOverlayProps = {
  seconds: number;
  visible: boolean;
  onHide: () => void;
  onFinish: () => void;
};

export function RestTimerOverlay({ seconds, visible, onHide, onFinish }: RestTimerOverlayProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!visible) return;
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, seconds, onFinish]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.label}>{t('client.today.restTimer')}</Text>
        <Text style={styles.time}>{formatRestLabel(remaining)}</Text>
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
    padding: 32,
    width: '100%',
  },
  label: {
    color: LIGHT.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  time: {
    color: LIGHT.textStrong,
    fontSize: 56,
    fontWeight: '800',
    marginBottom: 24,
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
