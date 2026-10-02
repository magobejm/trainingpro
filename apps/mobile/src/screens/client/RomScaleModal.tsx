import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LIGHT } from '../../theme/light';
import { ROM_SCALE_VALUES, type RomScaleValue } from './rom-scale.utils';

type RomScaleModalProps = {
  value: string;
  visible: boolean;
  onClose: () => void;
  onSave: (value: RomScaleValue) => void;
};

export function RomScaleModal(props: RomScaleModalProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Modal visible={props.visible} transparent animationType={'fade'} onRequestClose={props.onClose}>
      <Pressable style={styles.backdrop} onPress={props.onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{t('mobile.client.exercise.seriesTable.rom')}</Text>
          <View style={styles.chips}>
            {ROM_SCALE_VALUES.map((option) => {
              const selected = props.value === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => props.onSave(option)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {t(`mobile.client.exercise.rom.${option}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
    padding: 24,
    width: '100%',
  },
  title: {
    color: LIGHT.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  chips: {
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgSoft,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    paddingVertical: 12,
  },
  chipSelected: {
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.accent,
  },
  chipText: {
    color: LIGHT.textStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: LIGHT.accent,
  },
});
