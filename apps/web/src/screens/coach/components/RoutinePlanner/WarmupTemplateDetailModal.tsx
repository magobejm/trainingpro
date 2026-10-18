import React from 'react';
import { LoadingState } from '../../../../components/AsyncStatus';
import { useWarmupTemplateQuery, type WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';
import { WarmupExerciseList } from './WarmupExerciseList';
import { Button, Modal } from '@trainerpro/ui';

type Props = {
  template: null | WarmupTemplateView;
  templateId?: string;
  onClose: () => void;
  t: (k: string) => string;
  visible: boolean;
};

export function WarmupTemplateDetailModal({
  template: supplied,
  templateId,
  onClose,
  t,
  visible,
}: Props): React.JSX.Element {
  const query = useWarmupTemplateQuery(visible && !supplied ? templateId : undefined);
  const template = supplied ?? query.data;
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
      ) : query.isError ? (
        <Button label={t('routineVersions.retry')} onPress={() => void query.refetch()} />
      ) : (
        <LoadingState label={t('common.loading')} variant="rows" />
      )}
    </Modal>
  );
}
