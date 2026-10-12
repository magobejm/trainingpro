import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useCreateCheckpointMutation, useNutritionCheckpointsQuery } from '../../../data/hooks/useNutrition';
import type { NutritionPlan } from './nutrition.types';
import { styles } from './nutrition.styles';
import { Button, EmptyState, Modal, TextField, useToast } from '@trainerpro/ui';

type Props = {
  onClose: () => void;
  plan: NutritionPlan;
  visible: boolean;
};

export function CheckpointsModal(props: Props): React.JSX.Element | null {
  const { t } = useTranslation();
  const checkpointsQuery = useNutritionCheckpointsQuery(props.plan.id);
  const createMutation = useCreateCheckpointMutation();
  const [note, setNote] = useState('');
  const toast = useToast();

  if (!props.visible) return null;

  const checkpoints = checkpointsQuery.data ?? [];

  const onCreate = (): void =>
    void createMutation
      .mutateAsync({
        planId: props.plan.id,
        payload: {
          content: props.plan.content,
          note: note.trim() || null,
          planName: props.plan.name,
          setupData: props.plan.setupData,
        },
      })
      .then(() => {
        setNote('');
        toast.success(t('coach.nutrition.checkpoints.created'));
      });

  return (
    <Modal
      closeLabel={t('common.close')}
      footer={
        <Button label={t('coach.nutrition.checkpoints.create')} loading={createMutation.isPending} onPress={onCreate} />
      }
      onClose={props.onClose}
      size="md"
      title={t('coach.nutrition.checkpoints.title')}
      visible={props.visible}
    >
      <TextField label={t('coach.nutrition.checkpoints.note')} multiline onChangeText={setNote} value={note} />
      {checkpointsQuery.isLoading ? <EmptyState title={t('coach.nutrition.loading')} /> : null}
      {checkpoints.length === 0 && !checkpointsQuery.isLoading ? (
        <EmptyState title={t('coach.nutrition.checkpoints.empty')} />
      ) : null}
      {checkpoints.map((checkpoint) => (
        <View key={checkpoint.id} style={styles.listItem}>
          <Text style={styles.cardTitle}>{new Date(checkpoint.createdAt).toLocaleDateString()}</Text>
          {checkpoint.note ? <Text style={styles.cardMuted}>{checkpoint.note}</Text> : null}
        </View>
      ))}
    </Modal>
  );
}
