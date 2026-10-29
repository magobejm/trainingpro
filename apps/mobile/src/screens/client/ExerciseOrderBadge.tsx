import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';

type Props = {
  order: number;
  total: number;
};

export function ExerciseOrderBadge(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = t('mobile.client.session.orderBadge', { order: props.order, total: props.total });
  return (
    <>
      <Pressable
        accessibilityRole={'button'}
        onPress={() => setOpen(true)}
        style={styles.badge}
        testID={'exercise-order-badge'}
      >
        <Text style={styles.badgeText}>{label}</Text>
      </Pressable>
      <Modal animationType={'fade'} onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.backdrop}>
          <Pressable accessibilityRole={'button'} onPress={() => setOpen(false)} style={styles.backdropTap} />
          <View style={styles.sheet}>
            <Text style={styles.title}>{t('mobile.client.session.orderInfoTitle')}</Text>
            <Text style={styles.message}>{t('mobile.client.session.orderInfo')}</Text>
            <Pressable accessibilityRole={'button'} onPress={() => setOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>{t('mobile.client.session.orderInfoClose')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: LIGHT.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  backdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backdropTap: {
    backgroundColor: LIGHT.overlay,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    gap: 12,
    maxWidth: 420,
    padding: 24,
    width: '100%',
    zIndex: 1,
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  message: {
    color: LIGHT.accentDark,
    fontSize: 15,
    lineHeight: 22,
  },
  close: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusMd,
    marginTop: 8,
    paddingVertical: 12,
  },
  closeText: {
    color: LIGHT.textOnNavy,
    fontSize: 15,
    fontWeight: '700',
  },
});
