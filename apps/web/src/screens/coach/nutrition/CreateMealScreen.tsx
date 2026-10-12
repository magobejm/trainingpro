import { getLayoutStyle1 } from './CreateMealScreen.layout-styles';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, SearchBar, TextField, useToast } from '@trainerpro/ui';
import { useCreateMealMutation } from '../../../data/hooks/useNutrition';
import { useLibraryFoodsQuery } from '../../../data/hooks/useLibraryQuery';
import { MEAL_CATEGORIES } from './nutrition.types';
import { styles } from './nutrition.styles';
const KEYBOARD_NUMERIC = 'numeric' as const;
type Props = {
  onBack: () => void;
  onCreated: (mealId: string) => void;
};
type DraftIngredient = {
  amountGrams: string;
  foodId: string;
  foodName: string;
};
export function CreateMealScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(MEAL_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const foodsQuery = useLibraryFoodsQuery({ query });
  const createMutation = useCreateMealMutation();
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && name.trim().length === 0 ? t('coach.nutrition.meals.nameRequired') : null;
  const onSave = (): void => {
    setSubmitted(true);
    if (name.trim().length === 0) return;
    void saveMeal(props, createMutation, { category, ingredients, name, notes }).then(() =>
      toast.success(t('coach.nutrition.meals.created')),
    );
  };
  const totals = useMemo(() => sumIngredientMacros(ingredients, foodsQuery.data ?? []), [ingredients, foodsQuery.data]);
  const layoutStyle1 = getLayoutStyle1;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button label={t('common.back')} onPress={props.onBack} size="sm" style={styles.backButton} variant="secondary" />
      <Text style={styles.headerTitle}>{t('coach.nutrition.meals.create')}</Text>
      <TextField
        containerStyle={styles.fieldGap}
        error={nameError}
        label={t('coach.nutrition.meals.name')}
        onChangeText={setName}
        required
        value={name}
      />
      <Text style={styles.fieldLabel}>{t('coach.nutrition.meals.category')}</Text>
      <View style={layoutStyle1}>
        {MEAL_CATEGORIES.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.chip, category === item && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, category === item && styles.chipLabelActive]}>
              {t(`coach.nutrition.categories.${item}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextField
        containerStyle={styles.fieldGap}
        label={t('coach.nutrition.meals.notes')}
        multiline
        onChangeText={setNotes}
        value={notes}
      />
      <Text style={styles.sectionTitle}>{t('coach.nutrition.meals.addIngredient')}</Text>
      <SearchBar onChangeText={setQuery} placeholder={t('coach.nutrition.hub.foodSearchPlaceholder')} value={query} />
      {(foodsQuery.data ?? []).slice(0, 8).map((food) => (
        <Pressable
          key={food.id}
          onPress={() => addIngredient(ingredients, setIngredients, food.id, food.name)}
          style={styles.listItem}
        >
          <Text style={styles.cardTitle}>{food.name}</Text>
        </Pressable>
      ))}
      {ingredients.map((item, index) => (
        <View key={`${item.foodId}-${index}`} style={styles.card}>
          <Text style={styles.cardTitle}>{item.foodName}</Text>
          <TextField
            keyboardType={KEYBOARD_NUMERIC}
            label={t('coach.nutrition.meals.grams')}
            onChangeText={(value) => updateAmount(ingredients, setIngredients, index, value)}
            value={item.amountGrams}
          />
        </View>
      ))}
      <Text style={styles.cardMuted}>
        {t('coach.nutrition.meals.totals', {
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
        })}
      </Text>
      <Button
        label={createMutation.isPending ? t('coach.nutrition.saving') : t('coach.nutrition.save')}
        loading={createMutation.isPending}
        onPress={onSave}
        style={styles.ctaButton}
      />
    </ScrollView>
  );
}
function addIngredient(
  current: DraftIngredient[],
  setIngredients: React.Dispatch<React.SetStateAction<DraftIngredient[]>>,
  foodId: string,
  foodName: string,
): void {
  if (current.some((item) => item.foodId === foodId)) return;
  setIngredients([...current, { amountGrams: '100', foodId, foodName }]);
}
function updateAmount(
  current: DraftIngredient[],
  setIngredients: React.Dispatch<React.SetStateAction<DraftIngredient[]>>,
  index: number,
  value: string,
): void {
  const item = current[index];
  if (!item) return;
  const next = [...current];
  next[index] = { ...item, amountGrams: value };
  setIngredients(next);
}
type FoodMacroSnapshot = {
  caloriesKcal: null | number;
  carbsG: null | number;
  fatG: null | number;
  id: string;
  proteinG: null | number;
};
function sumIngredientMacros(ingredients: DraftIngredient[], foods: FoodMacroSnapshot[]) {
  return ingredients.reduce(
    (acc, item) => {
      const food = foods.find((entry) => entry.id === item.foodId);
      const grams = Number(item.amountGrams) || 0;
      const factor = grams / 100;
      return {
        calories: acc.calories + (food?.caloriesKcal ?? 0) * factor,
        carbs: acc.carbs + (food?.carbsG ?? 0) * factor,
        fat: acc.fat + (food?.fatG ?? 0) * factor,
        protein: acc.protein + (food?.proteinG ?? 0) * factor,
      };
    },
    { calories: 0, carbs: 0, fat: 0, protein: 0 },
  );
}
async function saveMeal(
  props: Props,
  createMutation: ReturnType<typeof useCreateMealMutation>,
  draft: {
    category: string;
    ingredients: DraftIngredient[];
    name: string;
    notes: string;
  },
): Promise<void> {
  const result = await createMutation.mutateAsync({
    category: draft.category,
    ingredients: draft.ingredients
      .map((item, index) => ({
        amountGrams: Number(item.amountGrams) || 0,
        foodId: item.foodId,
        sortOrder: index,
      }))
      .filter((item) => item.amountGrams > 0),
    name: draft.name.trim(),
    notes: draft.notes.trim() || null,
  });
  props.onCreated(result.id);
}
