import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { showComingSoon } from '../../shell/client/feedback';
import type { DayData } from './client-calendar.helpers';
import { MOOD_EMOJI } from './client-calendar.helpers';
import { LIGHT } from '../../theme/light';

type DayDetailModalProps = {
  data: DayData | undefined;
  dateStr: string;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
};

const MODAL_ANIM = 'fade' as const;

export function DayDetailModal({ data, dateStr, onClose, onOpenSession }: DayDetailModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const date = new Date(dateStr);
  const dateLabel = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', weekday: 'long' });
  const trainingTitle = data?.planDayTitle ?? (data?.hasPlanned || data?.hasCompleted ? '—' : null);
  const moodEmoji = data?.mood !== null && data?.mood !== undefined ? MOOD_EMOJI[data.mood] : null;

  return (
    <Modal animationType={MODAL_ANIM} onRequestClose={onClose} transparent>
      <Pressable onPress={onClose} style={styles.backdrop} />
      <View style={styles.card}>
        <Text style={styles.dateLabel}>{dateLabel}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('client.calendar.detail.training')}</Text>
          <Text style={styles.sectionValue}>{trainingTitle ?? t('client.calendar.detail.rest')}</Text>
          {moodEmoji ? <Text style={styles.mood}>{moodEmoji}</Text> : null}
        </View>

        {data?.hasMeeting ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('client.calendar.detail.meeting')}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {data?.sessionId ? (
            <Pressable onPress={() => onOpenSession(data.sessionId!)} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>{t('client.calendar.detail.viewSession')}</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => showComingSoon(t('client.calendar.detail.requestMeeting'))} style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>{t('client.calendar.detail.requestMeeting')}</Text>
          </Pressable>
        </View>

        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>{'✕'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 8, marginTop: 16 },
  backdrop: { backgroundColor: LIGHT.overlay, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  btnPrimary: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusSm,
    paddingVertical: 12,
  },
  btnPrimaryText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  btnSecondary: {
    alignItems: 'center',
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    paddingVertical: 12,
  },
  btnSecondaryText: { color: LIGHT.accentDark },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radius2xl,
    borderWidth: 1,
    elevation: 8,
    left: 20,
    padding: 20,
    position: 'absolute',
    right: 20,
    shadowColor: LIGHT.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    top: '25%',
  },
  closeBtn: { alignItems: 'center', marginTop: 12 },
  closeBtnText: { color: LIGHT.textMuted, fontSize: 16 },
  dateLabel: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '600', marginBottom: 12, textTransform: 'capitalize' },
  mood: { fontSize: 24, marginTop: 4 },
  section: { marginBottom: 8 },
  sectionTitle: { color: LIGHT.textMuted, fontSize: 12, marginBottom: 2 },
  sectionValue: { color: LIGHT.textStrong, fontSize: 15 },
});
