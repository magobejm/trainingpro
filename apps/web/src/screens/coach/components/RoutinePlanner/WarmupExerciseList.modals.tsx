import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WarmupTemplateItemInput } from '../../../../data/hooks/useWarmupTemplates';
import type { UnifiedExerciseItem } from '../../../../data/hooks/useUnifiedLibraryQuery';
import { ACCESSIBILITY_ROLE_BUTTON, MODAL_ANIM, TITLE_MAX_LINES } from './warmup-exercise-list.constants';
import { md } from './warmup-exercise-list.styles';

export function WarmupBlockDetailModal({
  visible,
  onClose,
  item,
  libraryItem,
}: {
  visible: boolean;
  onClose: () => void;
  item: WarmupTemplateItemInput;
  libraryItem: UnifiedExerciseItem | null;
}): React.JSX.Element {
  const { t } = useTranslation();
  const instructions = libraryItem?.coachInstructions?.trim() || libraryItem?.instructions?.trim();

  const bodyMessage = !libraryItem
    ? t('coach.warmupExerciseList.noLibraryExercise')
    : instructions
      ? instructions
      : t('coach.warmupExerciseList.noLibraryInstructions');

  return (
    <Modal animationType={MODAL_ANIM} onRequestClose={onClose} transparent visible={visible}>
      <View style={md.overlay}>
        <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={onClose} style={md.backdrop} />
        <View style={md.sheet}>
          <View style={md.header}>
            <Text style={md.title} numberOfLines={TITLE_MAX_LINES}>
              {item.displayName}
            </Text>
            <Pressable onPress={onClose} style={md.closeBtn}>
              <Text style={md.closeText}>{t('common.modalCloseGlyph')}</Text>
            </Pressable>
          </View>
          <ScrollView style={md.body} contentContainerStyle={md.bodyContent}>
            <Text style={libraryItem && instructions ? md.bodyText : md.muted}>{bodyMessage}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
