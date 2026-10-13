import { EmptyIllustration } from '../../../components/EmptyIllustrations';
import React from 'react';
import { Button, EmptyState, Modal } from '@trainerpro/ui';
import type { RoutineTemplateView } from '../../../data/hooks/useRoutineTemplates';
import { RoutineDetail } from './ClientTrainingPlanDetailModal.sections';

type Props = {
  visible: boolean;
  onClose: () => void;
  routine: RoutineTemplateView | null;
  t: (k: string, options?: Record<string, unknown>) => string;
};

export function ClientTrainingPlanDetailModal(props: Props): React.JSX.Element {
  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={<Button label={props.t('common.close')} onPress={props.onClose} variant="secondary" />}
      onClose={props.onClose}
      scroll={false}
      size="xl"
      title={props.t('coach.clientProfile.trainingPlan.modalTitle')}
      visible={props.visible}
    >
      {props.routine ? (
        <RoutineDetail routine={props.routine} t={props.t} />
      ) : (
        <EmptyState icon={<EmptyIllustration kind={'generic'} />} title={props.t('coach.clientProfile.trainingPlan.modalEmpty')} />
      )}
    </Modal>
  );
}
