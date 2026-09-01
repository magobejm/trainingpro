import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SessionItem } from '../../data/hooks/useTodaySession';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';
import { resolvePlannedSet } from './planned-set.utils';

type SetNoteModalProps = {
  item: SessionItem;
  setIndex: number | null;
  visible: boolean;
  onClose: () => void;
};

export function SetNoteModal({ item, setIndex, visible, onClose }: SetNoteModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const plannedSet = setIndex != null ? resolvePlannedSet(item.plannedSets, setIndex) : null;
  const setNumber = (plannedSet?.setIndex ?? 0) + 1;

  return (
    <Modal visible={visible} transparent animationType={'fade'} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{t('client.notes.setNote', { n: setNumber })}</Text>
          {plannedSet?.advancedTechnique?.trim() ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{plannedSet.advancedTechnique.trim()}</Text>
            </View>
          ) : null}
          {plannedSet?.note?.trim() ? (
            <Text style={styles.note}>{plannedSet.note.trim()}</Text>
          ) : (
            <Text style={styles.empty}>{t('mobile.client.setNote.empty')}</Text>
          )}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('client.wizard.close')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: LIGHT.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusXl,
    gap: 12,
    padding: 24,
    width: '100%',
  },
  title: {
    color: LIGHT.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.indigoSoft,
    borderRadius: LIGHT.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: LIGHT.indigo,
    fontSize: 12,
    fontWeight: '700',
  },
  note: {
    color: LIGHT.text,
    fontSize: 15,
    lineHeight: 22,
  },
  empty: {
    color: LIGHT.textMuted,
    fontSize: 14,
  },
  closeBtn: SESSION.secondaryBtn,
  closeBtnText: SESSION.secondaryBtnText,
});
