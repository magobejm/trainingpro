import { ClientPreviewButton, NutritionClientPreview } from '../../features/client-preview/ClientPreview';
import { NutritionPdfButton } from '../../features/pdf/PlanPdfButton';
import { EmptyIllustration } from '../../components/EmptyIllustrations';
import { LoadingState } from '../../components/AsyncStatus';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  useAssignPlanMutation,
  useClientNutritionPlansQuery,
  useNutritionPlansQuery,
  useNutritionMealsQuery,
} from '../../data/hooks/useNutrition';
import { useLibraryFoodsQuery } from '../../data/hooks/useLibraryQuery';
import { LIST_KEYS, replaceClientSearch, writeListContext } from '../../layout/list-context';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { CheckpointsModal } from './nutrition/CheckpointsModal';
import { ClientNutritionToday } from './nutrition/ClientNutritionToday';
import { ClientNutritionAdherence } from './nutrition/ClientNutritionAdherence';
import { ClientPlanChange } from './nutrition/ClientPlanChange';
import { readSetupData } from './nutrition/nutrition-tdee.utils';
import { PlanContentView } from './nutrition/PlanContentView';
import type { NutritionPlan, NutritionPlanType } from './nutrition/nutrition.types';
import { clientPlanStyles as s } from './nutrition/client-plan.styles';
import { styles } from './nutrition/nutrition.styles';
import { Button, EmptyState, useToast } from '@trainerpro/ui';

type Props = {
  clientId: string;
  clientName: string;
  onRouteChange?: (route: ShellRoute) => void;
};
type Tab = 'adherence' | 'content' | 'today';
type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Abre el asistente de creación del módulo de nutrición, conservando el rastro del cliente. */
function openPlanCreation(props: Props, type: NutritionPlanType): void {
  writeListContext(LIST_KEYS.nutrition, {
    checkpointPlanId: '',
    hubQuery: '',
    originClientId: props.clientId,
    originClientName: props.clientName,
    selectedFoodId: '',
    selectedMealId: '',
    view: 'wizard',
    wizardType: type,
  });
  replaceClientSearch(props.clientId);
  props.onRouteChange?.('coach.nutrition');
}

// eslint-disable-next-line max-lines-per-function
export function ClientNutritionPlanScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const plansQuery = useClientNutritionPlansQuery(props.clientId);
  const mealsQuery = useNutritionMealsQuery();
  const foodsQuery = useLibraryFoodsQuery({ query: '' });
  const templatesQuery = useNutritionPlansQuery();
  const assignMutation = useAssignPlanMutation();
  const toast = useToast();
  const [planType, setPlanType] = useState<NutritionPlanType | null>(null);
  const [tab, setTab] = useState<Tab>('content');
  const [changing, setChanging] = useState(false);
  const [checkpointPlan, setCheckpointPlan] = useState<null | NutritionPlan>(null);
  const plans = plansQuery.data ?? [];
  const selectedType = planType ?? preferredAssignedType(plans);
  const activePlan = useMemo(() => plans.find((plan) => plan.type === selectedType), [plans, selectedType]);
  const foods = foodsQuery.data ?? [];
  const meals = mealsQuery.data ?? [];
  const showPanel = changing || (!activePlan && !plansQuery.isLoading);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={s.root}>
        <View>
          <Text style={styles.headerTitle}>{props.clientName}</Text>
          <Text style={styles.headerSubtitle}>{t('coach.nutrition.client.title')}</Text>
        </View>
        {plansQuery.isLoading ? <LoadingState label={t('coach.nutrition.loading')} /> : null}
        {plans.length > 1 ? <AssignedTypeToggle onChange={setPlanType} t={t} value={selectedType} /> : null}
        {activePlan ? (
          <AssignedPlanCard
            clientName={props.clientName}
            meals={meals}
            onChange={() => setChanging((value) => !value)}
            onCheckpoints={() => setCheckpointPlan(activePlan)}
            plan={activePlan}
            t={t}
            mealsLoading={mealsQuery.isLoading || mealsQuery.isError}
          />
        ) : null}
        {!activePlan && !plansQuery.isLoading ? (
          <EmptyState icon={<EmptyIllustration kind={'library'} />} title={t('coach.nutrition.client.empty')} />
        ) : null}
        {showPanel ? (
          <ClientPlanChange
            assignedSourceIds={plans.map((plan) => plan.sourcePlanId).filter((id): id is string => Boolean(id))}
            assigning={assignMutation.isPending}
            assigningPlanId={assignMutation.variables?.planId}
            foods={foods}
            hasAssigned={Boolean(activePlan)}
            initialType={selectedType}
            meals={meals}
            onAssign={(planId) =>
              assignMutation.mutate(
                { clientId: props.clientId, planId },
                {
                  onError: () => toast.error(t('coach.nutrition.client.assignError')),
                  onSuccess: () => {
                    toast.success(t('coach.nutrition.client.assignedToast'));
                    setChanging(false);
                  },
                },
              )
            }
            onCreate={(type) => openPlanCreation(props, type)}
            t={t}
            templates={templatesQuery.data ?? []}
          />
        ) : null}
        {activePlan ? <PlanTabs tab={tab} onChange={setTab} t={t} /> : null}
        {activePlan && tab === 'content' ? (
          <PlanContentView content={activePlan.content} foods={foods} meals={meals} t={t} type={activePlan.type} />
        ) : null}
        {activePlan && tab === 'today' ? (
          <ClientNutritionToday clientId={props.clientId} foods={foods} meals={meals} plan={activePlan} t={t} />
        ) : null}
        {activePlan && tab === 'adherence' ? <ClientNutritionAdherence clientId={props.clientId} t={t} /> : null}
      </View>
      {checkpointPlan ? (
        <CheckpointsModal onClose={() => setCheckpointPlan(null)} plan={checkpointPlan} visible={Boolean(checkpointPlan)} />
      ) : null}
    </ScrollView>
  );
}

function AssignedPlanCard(props: {
  clientName: string;
  meals: Parameters<typeof NutritionPdfButton>[0]['meals'];
  mealsLoading: boolean;
  onChange: () => void;
  onCheckpoints: () => void;
  plan: NutritionPlan;
  t: Translate;
}): React.JSX.Element {
  const { plan, t } = props;
  const setup = readSetupData(plan.setupData);
  const tiles = setup
    ? [
        [t('coach.nutrition.macros.calories'), String(setup.targetCalories)],
        [t('coach.nutrition.macros.protein'), t('coach.nutrition.macros.grams', { value: setup.proteinG })],
        [t('coach.nutrition.macros.carbs'), t('coach.nutrition.macros.grams', { value: setup.carbsG })],
        [t('coach.nutrition.macros.fat'), t('coach.nutrition.macros.grams', { value: setup.fatG })],
      ]
    : [];
  return (
    <View style={s.card}>
      <View style={s.badge}>
        <Text style={s.badgeText}>
          {plan.type === 'LIBRE' ? t('coach.nutrition.plans.free') : t('coach.nutrition.plans.structured')}
        </Text>
      </View>
      <Text style={s.cardTitle}>{plan.name}</Text>
      {tiles.length > 0 ? (
        <View style={s.tileRow}>
          {tiles.map(([label, value]) => (
            <View key={label} style={s.tile}>
              <Text style={s.tileLabel}>{label}</Text>
              <Text style={s.tileValue}>{value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={s.row}>
        <ClientPreviewButton isDraft={false}>
          <NutritionClientPreview plan={plan} meals={props.meals} />
        </ClientPreviewButton>
        <NutritionPdfButton
          plan={plan}
          meals={props.meals}
          isDraft={false}
          clientName={props.clientName}
          disabled={props.mealsLoading}
        />
        <Button label={t('coach.nutrition.checkpoints.open')} onPress={props.onCheckpoints} size="sm" variant="secondary" />
        <Button label={t('coach.nutrition.client.changePlan')} onPress={props.onChange} size="sm" variant="secondary" />
      </View>
    </View>
  );
}

function AssignedTypeToggle(props: {
  onChange: (type: NutritionPlanType) => void;
  t: Translate;
  value: NutritionPlanType;
}): React.JSX.Element {
  return (
    <View style={s.chipRow}>
      <Chip
        active={props.value === 'LIBRE'}
        label={props.t('coach.nutrition.plans.free')}
        onPress={() => props.onChange('LIBRE')}
      />
      <Chip
        active={props.value === 'ESTRUCTURADO'}
        label={props.t('coach.nutrition.plans.structured')}
        onPress={() => props.onChange('ESTRUCTURADO')}
      />
    </View>
  );
}

function PlanTabs(props: { onChange: (tab: Tab) => void; tab: Tab; t: Translate }): React.JSX.Element {
  const tabs: Array<[Tab, string]> = [
    ['content', props.t('coach.nutrition.client.tabContent')],
    ['today', props.t('coach.nutrition.client.tabToday')],
    ['adherence', props.t('coach.nutrition.client.tabAdherence')],
  ];
  return (
    <View style={s.chipRow}>
      {tabs.map(([key, label]) => (
        <Chip key={key} active={props.tab === key} label={label} onPress={() => props.onChange(key)} />
      ))}
    </View>
  );
}

function Chip(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.chip, props.active && styles.chipActive]}>
      <Text style={[styles.chipLabel, props.active && styles.chipLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

function preferredAssignedType(plans: NutritionPlan[]): NutritionPlanType {
  if (plans.some((plan) => plan.type === 'ESTRUCTURADO')) return 'ESTRUCTURADO';
  return 'LIBRE';
}
