import React from 'react';
import { Text, View } from 'react-native';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';
import { WarmupExerciseList } from './WarmupExerciseList';
import { Modal, colors, fontSize, space } from '@trainerpro/ui';

type Props = {
  template: null | WarmupTemplateView;
  onClose: () => void;
  t: (k: string) => string;
  visible: boolean;
};

export function WarmupTemplateDetailModal({ template, onClose, t, visible }: Props): React.JSX.Element {
  return (
    <Modal
      closeLabel={t('common.close')}
      onClose={onClose}
      size="lg"
      title={template?.name ?? t('coach.routine.warmup.detail.title')}
      visible={visible}
    >
      {template ? (
        <WarmupExerciseList items={template.items} groups={template.groups} />
      ) : (
        <View style={st.loading}>
          <Text style={st.loadingText}>{t('common.loading')}</Text>
        </View>
      )}
    </Modal>
  );
}

const st = {
  loading: { padding: space.xl, alignItems: 'center' as const },
  loadingText: { fontSize: fontSize.sm, color: colors.textMuted },
};
