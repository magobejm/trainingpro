import React, { useState } from 'react';
import { Modal, SafeAreaView, Text, View } from 'react-native';
import { MEAL_CATEGORIES, type CoachNutritionMeal as NutritionMeal } from '@trainerpro/shared';
import { useCoachAuth, useCoachWrite } from '../../data/hooks/useCoachData';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import { createApiClient } from '../../data/api-client';
import { CoachButton, CoachField, CoachPage, CoachSelect, ui } from './CoachUi';
import { CoachLibraryScreen } from './CoachLibraryScreen';
import { useNutritionCopy, type NutritionCopyKey } from './coach-nutrition-copy';
import {
  mealTotals,
  nutritionVersion,
  nutritionDraftKey,
  type NutritionFood,
  type NutritionDraftOrigin,
} from './coach-nutrition-model';
type MealDraft = {
  name: string;
  category: string;
  notes: string;
  ingredients: Array<{ foodId: string; foodName: string; amountGrams: number; food?: NutritionFood }>;
};
type MealEditorProps = { meal?: NutritionMeal & NutritionDraftOrigin; onClose: () => void };
export function NutritionMealEditor(props: MealEditorProps) {
  return <NutritionMealView {...useNutritionMealModel(props)} {...props} />;
}
function useNutritionMealModel({ meal, onClose }: MealEditorProps) {
  const c = useNutritionCopy();
  const auth = useCoachAuth();
  const write = useCoachWrite<NutritionMeal>();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const [changed, setChanged] = useState(false);
  const initial: MealDraft = {
    name: meal?.name ?? '',
    category: meal?.category ?? 'breakfast',
    notes: meal?.notes ?? '',
    ingredients:
      meal?.ingredients.map((item) => ({
        foodId: item.foodId,
        foodName: item.food.name,
        amountGrams: item.amountGrams,
        food: item.food as NutritionFood,
      })) ?? [],
  };
  const draft = useCoachDraft<MealDraft>(
    nutritionDraftKey('meal', meal),
    initial,
    meal?.id ? nutritionVersion(meal) : undefined,
  );
  const value = draft.value;
  const set = (patch: Partial<MealDraft>) => draft.setValue((old) => ({ ...old, ...patch }));
  const save = async (copy = false) => {
    try {
      setError('');
      if (
        !value.name.trim() ||
        value.ingredients.some((item) => !Number.isFinite(item.amountGrams) || item.amountGrams <= 0)
      )
        throw new Error(c('invalid'));
      if (meal?.id && !copy) {
        const latest = await createApiClient(auth).get<{ items: NutritionMeal[] }>('/nutrition/meals');
        if (nutritionVersion(latest.items.find((item) => item.id === meal.id)) !== nutritionVersion(meal)) {
          setChanged(true);
          return;
        }
      }
      await write.mutateAsync({
        path: '/nutrition/meals' + (meal?.id && !copy ? '/' + meal.id : ''),
        method: meal?.id && !copy ? 'PATCH' : 'POST',
        body: {
          name: value.name.trim(),
          category: value.category,
          notes: value.notes || null,
          ingredients: value.ingredients.map((item, index) => ({
            foodId: item.foodId,
            amountGrams: item.amountGrams,
            sortOrder: index,
          })),
        },
      });
      await draft.clear();
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : c('invalid'));
    }
  };
  const totals = mealTotals(
    value.ingredients,
    value.ingredients.flatMap((item) => (item.food ? [item.food] : [])),
  );
  return { c, write, picking, setPicking, error, changed, draft, value, set, save, totals };
}
function NutritionMealView({
  meal,
  onClose,
  c,
  write,
  picking,
  setPicking,
  error,
  changed,
  draft,
  value,
  set,
  save,
  totals,
}: MealEditorProps & ReturnType<typeof useNutritionMealModel>) {
  return (
    <CoachPage title={meal ? c('edit') : c('newMeal')} onBack={onClose}>
      <MealFoodPicker
        visible={picking}
        onClose={() => setPicking(false)}
        onPick={(food) => {
          set({ ingredients: [...value.ingredients, { foodId: food.id, foodName: food.name, amountGrams: 100, food }] });
          setPicking(false);
        }}
      />
      <CoachField label={c('name')} value={value.name} onChange={(name) => set({ name })} />
      <CoachSelect
        label={c('category')}
        value={value.category}
        onChange={(category) => set({ category })}
        options={MEAL_CATEGORIES.map((v) => ({ value: v, label: c(v as NutritionCopyKey) }))}
      />
      <CoachField multiline label={c('notes')} value={value.notes} onChange={(notes) => set({ notes })} />
      <CoachButton label={c('addFood')} onPress={() => setPicking(true)} />
      {value.ingredients.map((item, index) => (
        <View key={item.foodId + '-' + index} style={ui.card}>
          <Text style={ui.label}>{item.foodName}</Text>
          <Text style={ui.muted}>{c('unit') + ': ' + (item.food?.servingUnit ?? '100 g')}</Text>
          <CoachField
            numeric
            label={c('quantity')}
            value={String(item.amountGrams)}
            onChange={(v) =>
              set({
                ingredients: value.ingredients.map((old, i) => (i === index ? { ...old, amountGrams: Number(v) } : old)),
              })
            }
          />
          <CoachButton
            danger
            label={c('remove')}
            onPress={() => set({ ingredients: value.ingredients.filter((_, i) => i !== index) })}
          />
        </View>
      ))}
      <Text style={ui.text}>
        {c('total') +
          ': ' +
          Math.round(totals.caloriesKcal) +
          ' kcal · ' +
          Math.round(totals.proteinG) +
          ' g P · ' +
          Math.round(totals.carbsG) +
          ' g C · ' +
          Math.round(totals.fatG) +
          ' g F'}
      </Text>
      {draft.conflict || changed ? (
        <View style={ui.card}>
          <Text style={ui.error}>{c('conflict')}</Text>
          <CoachButton
            label={c('reload')}
            onPress={() => {
              void draft.clear();
              onClose();
            }}
          />
        </View>
      ) : null}
      {error ? (
        <Text accessibilityRole={'alert'} style={ui.error}>
          {error}
        </Text>
      ) : null}
      <CoachButton
        label={c('save')}
        disabled={!draft.ready || draft.conflict || changed}
        loading={write.isPending}
        onPress={() => void save()}
      />
      <CoachButton label={c('copy')} disabled={!draft.ready} loading={write.isPending} onPress={() => void save(true)} />
    </CoachPage>
  );
}
function MealFoodPicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (food: NutritionFood) => void;
}) {
  const c = useNutritionCopy();
  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={ui.page}>
        <CoachButton label={c('back')} onPress={onClose} />
        <CoachLibraryScreen initialCategory={'foods'} onPick={(food) => onPick(food as NutritionFood)} />
      </SafeAreaView>
    </Modal>
  );
}
