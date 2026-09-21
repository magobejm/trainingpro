import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLibraryFoodsQuery } from '../../../data/hooks/useLibraryQuery';
import { useNutritionPlansQuery } from '../../../data/hooks/useNutrition';
import { BuildFreePlanScreen } from './BuildFreePlanScreen';
import { BuildStructuredPlanScreen } from './BuildStructuredPlanScreen';
import { CheckpointsModal } from './CheckpointsModal';
import { CreateMealScreen } from './CreateMealScreen';
import { CreatePlanScreen } from './CreatePlanScreen';
import { CreatedMealsScreen } from './CreatedMealsScreen';
import { MealDetailScreen } from './MealDetailScreen';
import { NutritionHubView } from './NutritionHubView';
import { PlanSetupWizard } from './PlanSetupWizard';
import { readSetupData } from './nutrition-tdee.utils';
import type { NutritionPlanType, PlanSetupData } from './nutrition.types';
import { styles } from './nutrition.styles';

type ViewState =
  | 'buildFree'
  | 'buildStructured'
  | 'createMeal'
  | 'createPlan'
  | 'foodDetail'
  | 'hub'
  | 'mealDetail'
  | 'meals'
  | 'wizard';

type WizardDraft = {
  name: string;
  planId?: string;
  setupData: PlanSetupData;
  type: NutritionPlanType;
};

export function NutritionScreen(): React.JSX.Element {
  const vm = useNutritionScreenModel();
  return <NutritionScreenView {...vm} />;
}

function useNutritionScreenModel() {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewState>('hub');
  const [selectedMealId, setSelectedMealId] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [wizardDraft, setWizardDraft] = useState<null | WizardDraft>(null);
  const [checkpointPlanId, setCheckpointPlanId] = useState('');
  const plansQuery = useNutritionPlansQuery();
  const foodsQuery = useLibraryFoodsQuery({ query: '' });
  const checkpointPlan = plansQuery.data?.find((plan) => plan.id === checkpointPlanId) ?? null;

  return {
    checkpointPlan,
    foodsQuery,
    plansQuery,
    onBackToHub: () => setView('hub'),
    onOpenCheckpoint: (planId: string) => setCheckpointPlanId(planId),
    onCloseCheckpoint: () => setCheckpointPlanId(''),
    selectedFoodId,
    selectedMealId,
    setSelectedFoodId,
    setSelectedMealId,
    setView,
    setWizardDraft,
    t,
    view,
    wizardDraft,
  };
}

type ViewModel = ReturnType<typeof useNutritionScreenModel>;

// eslint-disable-next-line max-lines-per-function
function NutritionScreenView(props: ViewModel): React.JSX.Element {
  if (props.view === 'meals') {
    return (
      <CreatedMealsScreen
        onBack={props.onBackToHub}
        onCreate={() => props.setView('createMeal')}
        onOpenMeal={(mealId) => {
          props.setSelectedMealId(mealId);
          props.setView('mealDetail');
        }}
      />
    );
  }
  if (props.view === 'createMeal') {
    return (
      <CreateMealScreen
        onBack={() => props.setView('meals')}
        onCreated={(mealId) => {
          props.setSelectedMealId(mealId);
          props.setView('mealDetail');
        }}
      />
    );
  }
  if (props.view === 'mealDetail' && props.selectedMealId) {
    return <MealDetailScreen mealId={props.selectedMealId} onBack={() => props.setView('meals')} />;
  }
  if (props.view === 'createPlan') {
    return (
      <CreatePlanScreen
        onBack={props.onBackToHub}
        onOpenPlan={(planId, type) => openExistingPlan(props, planId, type)}
        onStartWizard={(type) => {
          props.setWizardDraft({ name: '', setupData: emptySetup(), type });
          props.setView('wizard');
        }}
      />
    );
  }
  if (props.view === 'wizard' && props.wizardDraft) {
    return (
      <PlanSetupWizard
        onBack={() => props.setView('createPlan')}
        onComplete={(input) => {
          props.setWizardDraft({ ...props.wizardDraft!, name: input.name, setupData: input.setupData, type: input.type });
          props.setView(input.type === 'LIBRE' ? 'buildFree' : 'buildStructured');
        }}
        planType={props.wizardDraft.type}
      />
    );
  }
  if (props.view === 'buildFree' && props.wizardDraft) {
    return (
      <BuildFreePlanScreen
        onBack={() => props.setView('createPlan')}
        onSaved={(planId) => {
          props.onOpenCheckpoint(planId);
          props.onBackToHub();
        }}
        planId={props.wizardDraft.planId}
        planName={props.wizardDraft.name}
        setupData={props.wizardDraft.setupData}
      />
    );
  }
  if (props.view === 'buildStructured' && props.wizardDraft) {
    return (
      <BuildStructuredPlanScreen
        onBack={() => props.setView('createPlan')}
        onSaved={(planId) => {
          props.onOpenCheckpoint(planId);
          props.onBackToHub();
        }}
        planId={props.wizardDraft.planId}
        planName={props.wizardDraft.name}
        setupData={props.wizardDraft.setupData}
      />
    );
  }
  if (props.view === 'foodDetail' && props.selectedFoodId) {
    const food = props.foodsQuery.data?.find((item) => item.id === props.selectedFoodId);
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={props.onBackToHub} style={styles.backButton}>
          <Text style={styles.backLabel}>{props.t('common.back')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{food?.name ?? props.t('coach.nutrition.food.notFound')}</Text>
        {food ? (
          <View style={styles.card}>
            <Text style={styles.cardMuted}>
              {props.t('coach.nutrition.food.summary', {
                calories: food.caloriesKcal ?? '—',
                carbs: food.carbsG ?? '—',
                fat: food.fatG ?? '—',
                protein: food.proteinG ?? '—',
              })}
            </Text>
            {food.notes ? <Text style={styles.cardMuted}>{food.notes}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    );
  }
  return (
    <>
      <NutritionHubView
        onOpenCreatePlan={() => props.setView('createPlan')}
        onOpenFoodDetail={(foodId) => {
          props.setSelectedFoodId(foodId);
          props.setView('foodDetail');
        }}
        onOpenMeals={() => props.setView('meals')}
      />
      {props.checkpointPlan ? (
        <CheckpointsModal
          onClose={props.onCloseCheckpoint}
          plan={props.checkpointPlan}
          visible={Boolean(props.checkpointPlan)}
        />
      ) : null}
    </>
  );
}

function openExistingPlan(props: ViewModel, planId: string, type: NutritionPlanType): void {
  const plan = props.plansQuery.data?.find((item) => item.id === planId);
  const setup = readSetupData(plan?.setupData) ?? emptySetup();
  props.setWizardDraft({
    name: plan?.name ?? '',
    planId,
    setupData: setup,
    type,
  });
  props.setView(type === 'LIBRE' ? 'buildFree' : 'buildStructured');
}

function emptySetup(): PlanSetupData {
  return {
    activityLevel: 'moderate',
    age: 30,
    carbsG: 200,
    carbsPct: 40,
    fatG: 67,
    fatPct: 30,
    formula: 'mifflin',
    heightCm: 175,
    proteinG: 150,
    proteinPct: 30,
    sex: 'male',
    targetCalories: 2200,
    tdee: 2200,
    weightKg: 75,
  };
}
