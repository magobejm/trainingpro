import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NutritionMealLog } from '../../data/hooks/useNutritionLogs';
import { useDeleteNutritionLog, useSaveNutritionLog } from '../../data/hooks/useNutritionLogs';
import { NutritionChangedSheet, SavedMealNote } from './NutritionChangedSheet';
import { styles } from './nutrition-plan.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;
type Status = NutritionMealLog['status'];
type PlannedFood = { amount: number; foodId: string; name: string; servingUnit?: string | null };

export function NutritionMealActions(props: {
  date: string;
  mealKey: string;
  mealName: string;
  planId: string;
  planned: PlannedFood[];
  saved?: NutritionMealLog;
  t: Translate;
}): React.JSX.Element {
  const save = useSaveNutritionLog(props.date);
  const remove = useDeleteNutritionLog(props.date);
  const [open, setOpen] = useState(false);
  const mark = (status: Status) => {
    if (props.saved?.status === status) {
      remove.mutate(props.saved.id);
      setOpen(false);
      return;
    }
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
      {props.saved ? <SavedMealNote log={props.saved} t={props.t} /> : null}
      {open ? (
        <NutritionChangedSheet
          initial={initialDraft(props.saved, props.planned)}
          initialComment={props.saved?.comment ?? ''}
          initialPhoto={props.saved?.photoPath ?? null}
          onSave={(items, comment, photoPath) => {
            save.mutate({
              comment,
              date: props.date,
              eatenItems: items,
              mealKey: props.mealKey,
              mealName: props.mealName,
              photoPath,
              planId: props.planId,
              status: 'CHANGED',
            });
            setOpen(false);
          }}
          t={props.t}
        />
      ) : null}
    </View>
  );
}

function initialDraft(saved: NutritionMealLog | undefined, planned: PlannedFood[]) {
  const source = saved?.status === 'CHANGED' && saved.eatenItems.length > 0 ? saved.eatenItems : planned;
  return source.map((item) => ({
    amount: String(item.amount),
    foodId: item.foodId,
    name: item.name,
    servingUnit: item.servingUnit,
  }));
}

function StatusButton(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.toggleBtn, props.active && styles.toggleBtnActive]}>
      <Text style={[styles.toggleText, props.active && styles.toggleTextActive]}>{props.label}</Text>
    </Pressable>
  );
}
