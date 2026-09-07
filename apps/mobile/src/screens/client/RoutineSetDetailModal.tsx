import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientRoutineSet } from '../../data/hooks/useClientRoutineQuery';
import { advancedTechniqueDescription, advancedTechniqueDisplayLabel } from './advanced-technique.utils';
import { LIGHT } from '../../theme/light';
import { SESSION } from '../../theme/sessionStyles';

type RoutineSetDetailModalProps = {
  set: ClientRoutineSet | null;
  visible: boolean;
  onClose: () => void;
};

export function RoutineSetDetailModal({ set, visible, onClose }: RoutineSetDetailModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const setNumber = (set?.setIndex ?? 0) + 1;
  const technique = set?.advancedTechnique?.trim() ?? '';
  const techniqueLabel = technique ? advancedTechniqueDisplayLabel(technique, t) : '';
  const techniqueDesc = technique ? advancedTechniqueDescription(technique, t) : '';
  const note = set?.note?.trim() ?? '';

  return (
    <Modal visible={visible} transparent animationType={'fade'} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{t('client.notes.setNote', { n: setNumber })}</Text>
          {techniqueLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{techniqueLabel}</Text>
            </View>
          ) : null}
          {techniqueDesc ? (
            <ScrollView style={styles.scroll}>
              <Text style={styles.desc}>{techniqueDesc}</Text>
            </ScrollView>
          ) : null}
          {note ? <Text style={styles.note}>{note}</Text> : null}
          {!techniqueDesc && !note ? <Text style={styles.empty}>{t('mobile.client.setNote.empty')}</Text> : null}
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
    maxHeight: '80%',
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
  scroll: {
    maxHeight: 240,
  },
  desc: {
    color: LIGHT.text,
    fontSize: 15,
    lineHeight: 22,
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
