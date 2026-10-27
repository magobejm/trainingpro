import { Breadcrumbs } from '../../../layout/Breadcrumbs';
import type { Crumb } from '../../../layout/crumbs';
import { clientPath, SHELL_PATHS } from '../../../layout/shell-routes';
import { styles as clientStyles } from '../clients-screen.styles';
import React from 'react';
import { View } from 'react-native';
import { space } from '@trainerpro/ui';

export type NutritionCrumbView =
  | 'buildFree'
  | 'buildStructured'
  | 'createMeal'
  | 'createPlan'
  | 'foodDetail'
  | 'mealDetail'
  | 'meals'
  | 'wizard';

type Translate = (key: string) => string;

type CrumbInput = {
  clientId: string;
  clientName: string;
  foodName: string;
  mealName: string;
  onHub: () => void;
  onMeals: () => void;
  onPlans: () => void;
  planName: string;
  t: Translate;
  view: NutritionCrumbView;
};

/** Migas de nutrición. Si el plan sale de un cliente, el rastro empieza en su ficha. */
export function buildNutritionCrumbs(input: CrumbInput): Crumb[] {
  const tail = sectionSteps(input);
  const steps = input.clientId ? [...clientPrefix(input), ...tail] : [moduleRoot(input), ...tail];
  return steps.map((crumb, index) => (index === steps.length - 1 ? { label: crumb.label, to: null } : crumb));
}

export function NutritionCrumbBar(props: { crumbs: Crumb[]; label: string }): React.JSX.Element | null {
  if (props.crumbs.length === 0) return null;
  return (
    <View style={[clientStyles.breadcrumbCard, { marginBottom: space.md }]}>
      <Breadcrumbs accessibilityLabel={props.label} crumbs={props.crumbs} />
    </View>
  );
}

function clientPrefix(input: CrumbInput): Crumb[] {
  const name = input.clientName.trim() || input.t('coach.clients.title');
  return [
    { label: input.t('coach.clients.title'), to: SHELL_PATHS['coach.clients'] },
    { label: name, to: clientPath(input.clientId, null) },
    { label: input.t('coach.nutrition.client.title'), to: clientPath(input.clientId, 'nutrition') },
  ];
}

function moduleRoot(input: CrumbInput): Crumb {
  return { label: input.t('coach.nutrition.title'), onPress: input.onHub, to: null };
}

function sectionSteps(input: CrumbInput): Crumb[] {
  const meals: Crumb = { label: input.t('coach.nutrition.meals.title'), onPress: input.onMeals, to: null };
  const plans: Crumb = { label: input.t('coach.nutrition.plans.title'), onPress: input.onPlans, to: null };
  if (input.view === 'meals') return [meals];
  if (input.view === 'createMeal') return [meals, current(input.t('coach.nutrition.meals.create'))];
  if (input.view === 'mealDetail')
    return [meals, current(input.mealName.trim() || input.t('coach.nutrition.meals.notFound'))];
  if (input.view === 'createPlan') return [plans];
  if (input.view === 'wizard') return [plans, current(input.t('coach.nutrition.wizard.title'))];
  if (input.view === 'buildFree' || input.view === 'buildStructured') {
    return [plans, current(input.planName.trim() || input.t('coach.nutrition.plans.title'))];
  }
  return [current(input.foodName.trim() || input.t('coach.nutrition.food.notFound'))];
}

function current(label: string): Crumb {
  return { label, to: null };
}
