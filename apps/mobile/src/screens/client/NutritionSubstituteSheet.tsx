import { formatFoodAmount } from '@trainerpro/shared';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNutritionSubstitutes } from '../../data/hooks/useNutritionSubstitutes';
import { styles } from './nutrition-plan.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function NutritionSubstituteSheet(props: {
  foodId: string;
  grams: number;
  name: string;
  onClose: () => void;
  t: Translate;
}): React.JSX.Element {
  const query = useNutritionSubstitutes(props.foodId, Math.max(1, Math.round(props.grams)));
  return (
    <View style={styles.sheet}>
      <Text style={styles.planName}>{props.t('client.nutrition.substitutes', { name: props.name })}</Text>
      {(query.data ?? []).map((item) => (
        <Text key={item.foodId} style={styles.item}>
          {props.t('client.nutrition.shoppingItem', {
            amount: formatFoodAmount(item.grams, item.servingUnit, props.t),
            name: item.name,
          })}
        </Text>
      ))}
      {query.data && query.data.length === 0 ? (
        <Text style={styles.empty}>{props.t('client.nutrition.substitutesEmpty')}</Text>
      ) : null}
      <Pressable onPress={props.onClose}>
        <Text style={styles.dayLabel}>{props.t('client.nutrition.closeSubstitutes')}</Text>
      </Pressable>
    </View>
  );
}
