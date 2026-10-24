import { formatFoodAmount } from '@trainerpro/shared';
import React, { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { useNutritionFoodSearch, type EatenItem, type NutritionMealLog } from '../../data/hooks/useNutritionLogs';
import { MealPhotoButton } from './MealPhotoButton';
import { styles } from './nutrition-plan.styles';

const NUMBER_KEYBOARD = 'numeric' as const;

type Translate = (key: string, options?: Record<string, unknown>) => string;
type DraftItem = { amount: string; foodId: string; name: string; servingUnit?: string | null };

export function NutritionChangedSheet(props: {
  initial: DraftItem[];
  initialComment: string;
  initialPhoto: string | null;
  onSave: (items: Array<{ amount: number; foodId: string }>, comment: string, photoPath: string | null) => void;
  t: Translate;
}): React.JSX.Element {
  const [items, setItems] = useState<DraftItem[]>(props.initial);
  const [query, setQuery] = useState('');
  const [comment, setComment] = useState(props.initialComment);
  const [photoPath, setPhotoPath] = useState(props.initialPhoto);
  const foods = useNutritionFoodSearch(query);
  const add = (foodId: string, name: string, servingUnit: string | null) => {
    if (items.some((item) => item.foodId === foodId) || items.length >= 20) return;
    setItems((current) => [...current, { amount: servingUnit === 'porcion' ? '1' : '100', foodId, name, servingUnit }]);
    setQuery('');
  };
  return (
    <View style={styles.sheet}>
      <TextInput
        onChangeText={setQuery}
        placeholder={props.t('client.nutrition.searchFoods')}
        style={styles.comment}
        value={query}
      />
      {(foods.data ?? []).map((food) => (
        <Pressable key={food.foodId} onPress={() => add(food.foodId, food.name, food.servingUnit)}>
          <Text style={styles.item}>{food.name}</Text>
        </Pressable>
      ))}
      {items.map((item) => (
        <View key={item.foodId} style={styles.dayRow}>
          <Text style={styles.item}>{item.name}</Text>
          <TextInput
            keyboardType={NUMBER_KEYBOARD}
            onChangeText={(amount) => setItems((current) => updateAmount(current, item.foodId, amount))}
            style={styles.amount}
            value={item.amount}
          />
        </View>
      ))}
      <TextInput
        onChangeText={setComment}
        placeholder={props.t('client.nutrition.comment')}
        style={styles.comment}
        value={comment}
      />
      <MealPhotoButton onUploaded={setPhotoPath} t={props.t} />
      <Pressable
        onPress={() =>
          props.onSave(
            items.flatMap((item) => {
              const amount = Number(item.amount);
              return amount > 0 ? [{ amount, foodId: item.foodId }] : [];
            }),
            comment,
            photoPath,
          )
        }
      >
        <Text style={styles.dayLabel}>{props.t('client.nutrition.saveLog')}</Text>
      </Pressable>
    </View>
  );
}

export function SavedMealNote(props: { log: NutritionMealLog; t: Translate }): React.JSX.Element {
  return (
    <View style={styles.sheet}>
      {props.log.comment ? <Text style={styles.item}>{props.log.comment}</Text> : null}
      {props.log.eatenItems.map((item) => (
        <Text key={item.foodId} style={styles.item}>
          {eatenLine(item, props.t)}
        </Text>
      ))}
      {props.log.photoUrl ? <Image source={{ uri: props.log.photoUrl }} style={styles.photo} /> : null}
    </View>
  );
}

function updateAmount(items: DraftItem[], foodId: string, amount: string): DraftItem[] {
  return items.map((row) => (row.foodId === foodId ? { ...row, amount } : row));
}

function eatenLine(item: EatenItem, t: Translate): string {
  return `${item.name} · ${formatFoodAmount(item.amount, item.servingUnit, t)} · ${Math.round(item.caloriesKcal)} kcal`;
}
