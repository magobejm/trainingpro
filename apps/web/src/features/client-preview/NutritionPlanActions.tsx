import React from 'react';
import { View } from 'react-native';
import type { NutritionMeal, NutritionPlan } from '../../screens/coach/nutrition/nutrition.types';
import { NutritionPdfButton } from '../pdf/PlanPdfButton';
import { ClientPreviewButton, NutritionClientPreview } from './ClientPreview';

type Plan = Pick<NutritionPlan, 'name' | 'type' | 'content' | 'setupData'> & Partial<Pick<NutritionPlan, 'description'>>;
export function NutritionPlanActions(props: {
  plan: Plan;
  meals: NutritionMeal[];
  isDraft: boolean;
  disabled: boolean;
}): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      <ClientPreviewButton isDraft={props.isDraft} disabled={props.disabled}>
        <NutritionClientPreview plan={props.plan} meals={props.meals} />
      </ClientPreviewButton>
      <NutritionPdfButton {...props} />
    </View>
  );
}
