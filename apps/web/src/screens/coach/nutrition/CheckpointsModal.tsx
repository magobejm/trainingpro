import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useCreateCheckpointMutation, useNutritionCheckpointsQuery } from '../../../data/hooks/useNutrition';
import type { NutritionPlan } from './nutrition.types';
import { styles } from './nutrition.styles';

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

  if (!props.visible) return null;

  const checkpoints = checkpointsQuery.data ?? [];

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.headerTitle}>{t('coach.nutrition.checkpoints.title')}</Text>
          <Pressable onPress={props.onClose}>
            <Text style={styles.backLabel}>{t('common.close')}</Text>
          </Pressable>
        </View>
        <Text style={styles.fieldLabel}>{t('coach.nutrition.checkpoints.note')}</Text>
        <TextInput multiline onChangeText={setNote} style={styles.field} value={note} />
        <Pressable
          disabled={createMutation.isPending}
          onPress={() =>
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
              .then(() => setNote(''))
          }
          style={styles.ctaButton}
        >
          <Text style={styles.ctaLabel}>{t('coach.nutrition.checkpoints.create')}</Text>
        </Pressable>
        <ScrollView style={{ marginTop: 12, maxHeight: 280 }}>
          {checkpointsQuery.isLoading ? <Text style={styles.empty}>{t('coach.nutrition.loading')}</Text> : null}
          {checkpoints.length === 0 && !checkpointsQuery.isLoading ? (
            <Text style={styles.empty}>{t('coach.nutrition.checkpoints.empty')}</Text>
          ) : null}
          {checkpoints.map((checkpoint) => (
            <View key={checkpoint.id} style={styles.listItem}>
              <Text style={styles.cardTitle}>{new Date(checkpoint.createdAt).toLocaleDateString()}</Text>
              {checkpoint.note ? <Text style={styles.cardMuted}>{checkpoint.note}</Text> : null}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
