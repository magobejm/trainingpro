import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { CircularCountdown } from './CircularCountdown';

type RestTimerOverlayProps = {
  remaining: number;
  totalSeconds: number;
  visible: boolean;
  onHide: () => void;
  onFinish: () => void;
  onShift: (deltaSeconds: number) => void;
};

const SHIFT_SECONDS = 15;

export function RestTimerOverlay({
  remaining,
  totalSeconds,
  visible,
  onHide,
  onFinish,
  onShift,
}: RestTimerOverlayProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.label}>{t('client.today.restTimer')}</Text>
        <CircularCountdown remaining={remaining} size={220} strokeWidth={14} totalSeconds={totalSeconds} />
        <View style={styles.shiftRow}>
          <Pressable onPress={() => onShift(-SHIFT_SECONDS)} style={styles.shiftBtn}>
            <Text style={styles.shiftText}>{t('mobile.client.rest.minus15')}</Text>
          </Pressable>
          <Pressable onPress={() => onShift(SHIFT_SECONDS)} style={styles.shiftBtn}>
            <Text style={styles.shiftText}>{t('mobile.client.rest.plus15')}</Text>
          </Pressable>
        </View>
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
  shiftRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  shiftBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgSoft,
    borderRadius: LIGHT.radiusMd,
    flex: 1,
    paddingVertical: 12,
  },
  shiftText: {
    color: LIGHT.textStrong,
    fontSize: 16,
    fontWeight: '800',
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
