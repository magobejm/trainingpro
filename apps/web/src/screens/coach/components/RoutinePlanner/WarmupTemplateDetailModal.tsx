import React from 'react';
import { LoadingState } from '../../../../components/AsyncStatus';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';
import { WarmupExerciseList } from './WarmupExerciseList';
import { Modal } from '@trainerpro/ui';

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
        <LoadingState label={t('common.loading')} variant="rows" />
      )}
    </Modal>
  );
}
