import { buildShoppingList, formatFoodAmount, resolvePlanDay, type ShoppingRange } from '@trainerpro/shared';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useClientNutritionQuery } from '../../data/hooks/useClientNutrition';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { readBought, writeBought } from './shopping-storage';
import { styles } from './nutrition-plan.styles';

export function ShoppingListScreen({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const query = useClientNutritionQuery();
  const plan = query.data?.estructuradoPlan ?? query.data?.librePlan;
  const weekKey = plan ? `${plan.id}:${resolvePlanDay(plan, plan.assignedAt, new Date()).weekIndex}` : '';
  const [bought, setBought] = useState<string[]>([]);
  const [range, setRange] = useState<ShoppingRange>('week');
  useEffect(() => setBought(readBought(weekKey)), [weekKey]);
  const groups = plan
    ? buildShoppingList(plan, plan.assignedAt, new Date(), query.data?.meals ?? [], query.data?.foods ?? [], range)
    : [];
  const toggle = (foodId: string) => {
    const next = bought.includes(foodId) ? bought.filter((id) => id !== foodId) : [...bought, foodId];
    setBought(next);
    writeBought(weekKey, next);
  };
  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.nutrition.shopping')} />
      <ScrollView contentContainerStyle={styles.content}>
        <RangeToggle onChange={setRange} range={range} t={t} />
        {groups.length === 0 ? <Text style={styles.empty}>{t('client.nutrition.shoppingEmpty')}</Text> : null}
        {groups.map((group) => (
          <ShoppingGroup bought={bought} group={group} key={group.category} onToggle={toggle} t={t} />
        ))}
      </ScrollView>
    </View>
  );
}

function ShoppingGroup(props: {
  bought: string[];
  group: { category: string; items: Array<{ foodId: string; grams: number; name: string; servingUnit?: string | null }> };
  onToggle: (foodId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  const label = categoryLabel(props.group.category, props.t);
  return (
    <View style={styles.mealCard}>
      <Text style={styles.planName}>{label}</Text>
      {props.group.items.map((item) => (
        <Pressable key={item.foodId} onPress={() => props.onToggle(item.foodId)}>
          <Text style={props.bought.includes(item.foodId) ? styles.bought : styles.item}>
            {props.t('client.nutrition.shoppingItem', {
              amount: formatFoodAmount(item.grams, item.servingUnit, props.t),
              name: item.name,
            })}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function RangeToggle(props: {
  onChange: (range: ShoppingRange) => void;
  range: ShoppingRange;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.toggleRow}>
      <Pressable
        onPress={() => props.onChange('day')}
        style={[styles.toggleBtn, props.range === 'day' && styles.toggleBtnActive]}
      >
        <Text style={[styles.toggleText, props.range === 'day' && styles.toggleTextActive]}>
          {props.t('client.nutrition.shoppingDay')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => props.onChange('week')}
        style={[styles.toggleBtn, props.range === 'week' && styles.toggleBtnActive]}
      >
        <Text style={[styles.toggleText, props.range === 'week' && styles.toggleTextActive]}>
          {props.t('client.nutrition.shoppingWeek')}
        </Text>
      </Pressable>
    </View>
  );
}

function categoryLabel(category: string, t: (key: string) => string): string {
  if (category === 'other') return t('client.nutrition.categoryOther');
  const key = `client.nutrition.foodCategory.${category}`;
  const label = t(key);
  return label === key ? category : label;
}
