import React from 'react';
import { Text } from 'react-native';
import { Modal } from '@trainerpro/ui';
import { useTranslation } from 'react-i18next';
import type { WarmupTemplateItemInput } from '../../../../data/hooks/useWarmupTemplates';
import type { UnifiedExerciseItem } from '../../../../data/hooks/useUnifiedLibraryQuery';
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
  const instructions = libraryItem?.coachInstructions?.trim() ?? '';

  const bodyMessage = !libraryItem
    ? t('coach.warmupExerciseList.noLibraryExercise')
    : instructions
      ? instructions
      : t('coach.warmupExerciseList.noLibraryInstructions');

  return (
    <Modal
      closeLabel={t('common.close')}
      dismissOnOverlay
      onClose={onClose}
      size="md"
      title={item.displayName}
      visible={visible}
    >
      <Text style={libraryItem && instructions ? md.bodyText : md.muted}>{bodyMessage}</Text>
    </Modal>
  );
}
