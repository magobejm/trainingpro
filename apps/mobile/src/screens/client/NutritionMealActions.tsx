import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { NutritionMealLog } from '../../data/hooks/useNutritionLogs';
import { useSaveNutritionLog } from '../../data/hooks/useNutritionLogs';
import { MealPhotoButton } from './MealPhotoButton';
import { styles } from './nutrition-plan.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;
type Status = NutritionMealLog['status'];

export function NutritionMealActions(props: {
  date: string;
  mealKey: string;
  mealName: string;
  planId: string;
  saved?: NutritionMealLog;
  t: Translate;
}): React.JSX.Element {
  const save = useSaveNutritionLog(props.date);
  const [comment, setComment] = useState(props.saved?.comment ?? '');
  const [photoPath, setPhotoPath] = useState(props.saved?.photoPath ?? null);
  const [open, setOpen] = useState(false);
  const mark = (status: Status) => {
    if (status === 'CHANGED') {
      setOpen(true);
      return;
    }
    setOpen(false);
    save.mutate({ date: props.date, mealKey: props.mealKey, mealName: props.mealName, planId: props.planId, status });
  };
  return (
    <View>
      <View style={styles.toggleRow}>
        <StatusButton
          active={props.saved?.status === 'DONE'}
          label={props.t('client.nutrition.statusDone')}
          onPress={() => mark('DONE')}
        />
        <StatusButton
          active={props.saved?.status === 'CHANGED'}
          label={props.t('client.nutrition.statusChanged')}
          onPress={() => mark('CHANGED')}
        />
        <StatusButton
          active={props.saved?.status === 'SKIPPED'}
          label={props.t('client.nutrition.statusSkipped')}
          onPress={() => mark('SKIPPED')}
        />
      </View>
      {open ? (
        <View>
          <TextInput
            onChangeText={setComment}
            placeholder={props.t('client.nutrition.comment')}
            style={styles.comment}
            value={comment}
          />
          <MealPhotoButton onUploaded={setPhotoPath} t={props.t} />
          <Pressable
            onPress={() => {
              save.mutate({
                comment,
                date: props.date,
                mealKey: props.mealKey,
                mealName: props.mealName,
                photoPath,
                planId: props.planId,
                status: 'CHANGED',
              });
              setOpen(false);
            }}
          >
            <Text style={styles.dayLabel}>{props.t('client.nutrition.saveLog')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function StatusButton(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.toggleBtn, props.active && styles.toggleBtnActive]}>
      <Text style={[styles.toggleText, props.active && styles.toggleTextActive]}>{props.label}</Text>
    </Pressable>
  );
}
