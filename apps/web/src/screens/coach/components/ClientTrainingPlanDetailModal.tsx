import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { RoutineTemplateView } from '../../../data/hooks/useRoutineTemplates';
import { RoutineDetail } from './ClientTrainingPlanDetailModal.sections';
import { styles } from './ClientTrainingPlanDetailModal.styles';

const ANIM = 'fade' as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  routine: RoutineTemplateView | null;
  t: (k: string, options?: Record<string, unknown>) => string;
};

export function ClientTrainingPlanDetailModal(props: Props): React.JSX.Element {
  return (
    <Modal animationType={ANIM} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{props.t('coach.clientProfile.trainingPlan.modalTitle')}</Text>
          {props.routine ? (
            <RoutineDetail routine={props.routine} t={props.t} />
          ) : (
            <Text style={styles.empty}>
              {props.t('coach.clientProfile.trainingPlan.modalEmpty')}
            </Text>
          )}
          <Pressable onPress={props.onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>{props.t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
