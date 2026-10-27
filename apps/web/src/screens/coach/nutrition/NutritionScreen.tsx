import React, { useEffect, useRef, useState } from 'react';
import { clientIdFromSearch, LIST_KEYS, replaceClientSearch } from '../../../layout/list-context';
import { useMenuEpoch } from '../../../layout/menu-client-context';
import { useListContext } from '../../../layout/useListContext';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useClientsQuery } from '../../../data/hooks/useClientsQuery';
import { useLibraryFoodsQuery } from '../../../data/hooks/useLibraryQuery';
import { useNutritionMealsQuery, useNutritionPlansQuery } from '../../../data/hooks/useNutrition';
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
import { ConsiderationBadges } from './ConsiderationBadges';
import { buildNutritionCrumbs, NutritionCrumbBar, type NutritionCrumbView } from './nutrition-crumbs';
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
  const [list, setList] = useListContext(LIST_KEYS.nutrition, emptyNutritionContext(), reviveNutritionContext);
  const [wizardDraft, setWizardDraft] = useState<null | WizardDraft>(() =>
    list.view === 'wizard' && list.wizardType ? { name: '', setupData: emptySetup(), type: list.wizardType } : null,
  );
  const setView = (view: ViewState) => setList((prev) => ({ ...prev, view }));
  const setSelectedMealId = (selectedMealId: string) => setList((prev) => ({ ...prev, selectedMealId }));
  const setSelectedFoodId = (selectedFoodId: string) => setList((prev) => ({ ...prev, selectedFoodId }));
  const setCheckpointPlanId = (checkpointPlanId: string) => setList((prev) => ({ ...prev, checkpointPlanId }));
  const setHubQuery = (hubQuery: string) => setList((prev) => ({ ...prev, hubQuery }));
  const plansQuery = useNutritionPlansQuery();
  const mealsQuery = useNutritionMealsQuery();
  const foodsQuery = useLibraryFoodsQuery({ query: '' });
  const clientsQuery = useClientsQuery();
  const checkpointPlan = plansQuery.data?.find((plan) => plan.id === list.checkpointPlanId) ?? null;
  const listed = clientsQuery.data?.find((client) => client.id === list.originClientId);
  const listedName = listed ? `${listed.firstName} ${listed.lastName}`.trim() : '';
  useClearOriginOnMenu(setList);

  return {
    checkpointPlan,
    foodsQuery,
    hubQuery: list.hubQuery,
    mealName: mealsQuery.data?.find((meal) => meal.id === list.selectedMealId)?.name ?? '',
    onBackToHub: () => {
      replaceClientSearch(null);
      setList((prev) => ({ ...prev, originClientId: '', originClientName: '', view: 'hub' }));
    },
    onOpenCheckpoint: (planId: string) => setCheckpointPlanId(planId),
    onCloseCheckpoint: () => setCheckpointPlanId(''),
    originClientId: list.originClientId,
    originClientName: list.originClientName.trim() || listedName,
    plansQuery,
    selectedFoodId: list.selectedFoodId,
    selectedMealId: list.selectedMealId,
    setHubQuery,
    setSelectedFoodId,
    setSelectedMealId,
    setView,
    setWizardDraft,
    t,
    view: list.view,
    wizardDraft,
  };
}

function useClearOriginOnMenu(setList: React.Dispatch<React.SetStateAction<NutritionContext>>): void {
  const menuEpoch = useMenuEpoch();
  const seenEpoch = useRef(menuEpoch);
  useEffect(() => {
    if (seenEpoch.current === menuEpoch) return;
    seenEpoch.current = menuEpoch;
    setList(emptyNutritionContext());
  }, [menuEpoch, setList]);
}

type NutritionContext = {
  checkpointPlanId: string;
  hubQuery: string;
  originClientId: string;
  originClientName: string;
  selectedFoodId: string;
  selectedMealId: string;
  view: ViewState;
  wizardType: '' | NutritionPlanType;
};

function emptyNutritionContext(): NutritionContext {
  return {
    checkpointPlanId: '',
    hubQuery: '',
    originClientId: '',
    originClientName: '',
    selectedFoodId: '',
    selectedMealId: '',
    view: 'hub',
    wizardType: '',
  };
}

function reviveNutritionContext(stored: NutritionContext | null, initial: NutritionContext): NutritionContext {
  const keep = stored && (PERSISTED_NUTRITION_VIEWS.has(stored.view) || (stored.view === 'wizard' && stored.wizardType));
  const revived = stored && keep ? { ...initial, ...stored } : { ...initial };
  const urlClient = typeof window === 'undefined' ? '' : (clientIdFromSearch(window.location.search) ?? '');
  if (!revived.originClientId && urlClient && revived.view !== 'hub') revived.originClientId = urlClient;
  return revived;
}

const PERSISTED_NUTRITION_VIEWS = new Set<ViewState>([
  'createMeal',
  'createPlan',
  'foodDetail',
  'hub',
  'mealDetail',
  'meals',
]);

type ViewModel = ReturnType<typeof useNutritionScreenModel>;

// eslint-disable-next-line max-lines-per-function
function NutritionScreenView(props: ViewModel): React.JSX.Element {
  const crumbs = nutritionCrumbs(props);
  if (props.view === 'meals') {
    return (
      <CreatedMealsScreen
        crumbs={crumbs}
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
        crumbs={crumbs}
        onCreated={(mealId) => {
          props.setSelectedMealId(mealId);
          props.setView('mealDetail');
        }}
      />
    );
  }
  if (props.view === 'mealDetail' && props.selectedMealId) {
    return <MealDetailScreen crumbs={crumbs} mealId={props.selectedMealId} onDeleted={() => props.setView('meals')} />;
  }
  if (props.view === 'createPlan') {
    return (
      <CreatePlanScreen
        crumbs={crumbs}
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
        crumbs={crumbs}
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
        crumbs={crumbs}
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
        crumbs={crumbs}
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
        <NutritionCrumbBar crumbs={crumbs} label={props.t('app.breadcrumb')} />
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
            <ConsiderationBadges items={food.considerations} t={props.t} />
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
        onQueryChange={props.setHubQuery}
        query={props.hubQuery}
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

function nutritionCrumbs(props: ViewModel) {
  if (!isNutritionCrumbView(props.view)) return [];
  const food = props.foodsQuery.data?.find((item) => item.id === props.selectedFoodId);
  return buildNutritionCrumbs({
    clientId: props.originClientId,
    clientName: props.originClientName,
    foodName: food?.name ?? '',
    mealName: props.mealName,
    onHub: props.onBackToHub,
    onMeals: () => props.setView('meals'),
    onPlans: () => props.setView('createPlan'),
    planName: props.wizardDraft?.name ?? '',
    t: props.t,
    view: props.view,
  });
}

function isNutritionCrumbView(view: ViewState): view is NutritionCrumbView {
  return view !== 'hub';
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
