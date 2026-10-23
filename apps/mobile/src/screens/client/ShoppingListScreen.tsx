import { buildShoppingList, resolvePlanDay } from '@trainerpro/shared';
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
  useEffect(() => setBought(readBought(weekKey)), [weekKey]);
  const groups = plan
    ? buildShoppingList(plan, plan.assignedAt, new Date(), query.data?.meals ?? [], query.data?.foods ?? [])
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
  group: { category: string; items: Array<{ foodId: string; grams: number; name: string }> };
  onToggle: (foodId: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  const label = props.group.category === 'other' ? props.t('client.nutrition.categoryOther') : props.group.category;
  return (
    <View style={styles.mealCard}>
      <Text style={styles.planName}>{label}</Text>
      {props.group.items.map((item) => (
        <Pressable key={item.foodId} onPress={() => props.onToggle(item.foodId)}>
          <Text style={props.bought.includes(item.foodId) ? styles.bought : styles.item}>
            {props.t('client.nutrition.shoppingItem', { grams: item.grams, name: item.name })}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
