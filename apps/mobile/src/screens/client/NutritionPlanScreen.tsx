import { ClientNutritionMacrosCard, ClientNutritionMealGroups } from '@trainerpro/ui';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientNutritionQuery, type ClientNutrition, type NutritionPlan } from '../../data/hooks/useClientNutrition';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { buildMealGroups, hasNutritionPlanData, readSetupData, resolvePlanDay } from './nutrition-plan.helpers';
import { moveNutritionDay, NutritionTodayPanel } from './NutritionTodayPanel';
import { styles } from './nutrition-plan.styles';
import { LIGHT } from '../../theme/light';

type Props = { onClose: () => void };
type PlanTab = 'estructurado' | 'libre';
type ScreenView = 'plan' | 'today';
type ClientNutritionFoods = ClientNutrition['foods'];
type ClientNutritionMeals = ClientNutrition['meals'];

const SPINNER_SIZE = 'large' as const;

export function NutritionPlanScreen({ onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = useClientNutritionQuery();
  const [activeTab, setActiveTab] = useState<PlanTab | null>(null);
  const [view, setView] = useState<ScreenView>('today');
  const [day, setDay] = useState(() => new Date());
  const resolvedTab = useMemo(() => resolveTab(query.data, activeTab), [activeTab, query.data]);
  const activePlan = resolvedTab === 'estructurado' ? query.data?.estructuradoPlan : query.data?.librePlan;

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.nutrition.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('client.nutrition.subtitle')}</Text>
        <NutritionBody
          activePlan={activePlan}
          day={day}
          onShift={(days) => setDay((current) => moveNutritionDay(current, days))}
          query={query}
          resolvedTab={resolvedTab}
          setActiveTab={setActiveTab}
          setView={setView}
          t={t}
          view={view}
        />
      </ScrollView>
    </View>
  );
}

function NutritionBody(props: {
  activePlan: NutritionPlan | null | undefined;
  day: Date;
  onShift: (days: number) => void;
  query: ReturnType<typeof useClientNutritionQuery>;
  resolvedTab: PlanTab | null;
  setActiveTab: (tab: PlanTab) => void;
  setView: (view: ScreenView) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  view: ScreenView;
}): React.JSX.Element {
  if (props.query.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={LIGHT.accent} size={SPINNER_SIZE} />
      </View>
    );
  }
  if (props.query.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{props.t('client.nutrition.error')}</Text>
      </View>
    );
  }
  if (!props.activePlan || !props.resolvedTab || !props.query.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{props.t('client.nutrition.empty')}</Text>
      </View>
    );
  }
  const showToggle = Boolean(props.query.data.librePlan && props.query.data.estructuradoPlan);
  return (
    <>
      <ViewToggle onChange={props.setView} t={props.t} view={props.view} />
      {showToggle ? <PlanToggle active={props.resolvedTab} onChange={props.setActiveTab} t={props.t} /> : null}
      {props.activePlan.name ? <Text style={styles.planName}>{props.activePlan.name}</Text> : null}
      {props.view === 'today' ? (
        <NutritionTodayPanel
          data={props.query.data}
          date={props.day}
          onShift={props.onShift}
          plan={props.activePlan}
          t={props.t}
        />
      ) : (
        <FullPlan foods={props.query.data.foods} meals={props.query.data.meals} plan={props.activePlan} t={props.t} />
      )}
    </>
  );
}

function FullPlan({
  foods,
  meals,
  plan,
  t,
}: {
  foods?: ClientNutritionFoods;
  meals?: ClientNutritionMeals;
  plan: NutritionPlan;
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  const setup = readSetupData(plan.setupData);
  const weekIndex = resolvePlanDay(plan, plan.assignedAt, new Date()).weekIndex;
  const mealGroups = buildMealGroups(plan, weekIndex);
  return (
    <>
      {plan.description ? <Text style={styles.planDescription}>{plan.description}</Text> : null}
      {setup ? <ClientNutritionMacrosCard setup={setup} t={t} /> : null}
      {mealGroups.length > 0 ? (
        <ClientNutritionMealGroups foods={foods} groups={mealGroups} meals={meals} t={t} />
      ) : (
        <View style={styles.center}>
          <Text style={styles.empty}>{t('client.nutrition.noMeals')}</Text>
        </View>
      )}
    </>
  );
}

function ViewToggle(props: {
  onChange: (view: ScreenView) => void;
  t: (key: string) => string;
  view: ScreenView;
}): React.JSX.Element {
  return (
    <View style={styles.toggleRow}>
      <ToggleButton
        active={props.view === 'today'}
        label={props.t('client.nutrition.viewToday')}
        onPress={() => props.onChange('today')}
      />
      <ToggleButton
        active={props.view === 'plan'}
        label={props.t('client.nutrition.viewPlan')}
        onPress={() => props.onChange('plan')}
      />
    </View>
  );
}

function PlanToggle(props: {
  active: PlanTab;
  onChange: (tab: PlanTab) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.toggleRow}>
      <ToggleButton
        active={props.active === 'libre'}
        label={props.t('client.nutrition.tabLibre')}
        onPress={() => props.onChange('libre')}
      />
      <ToggleButton
        active={props.active === 'estructurado'}
        label={props.t('client.nutrition.tabEstructurado')}
        onPress={() => props.onChange('estructurado')}
      />
    </View>
  );
}

function ToggleButton(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.toggleBtn, props.active && styles.toggleBtnActive]}>
      <Text style={[styles.toggleText, props.active && styles.toggleTextActive]}>{props.label}</Text>
    </Pressable>
  );
}

function resolveTab(data: ReturnType<typeof useClientNutritionQuery>['data'], activeTab: PlanTab | null): PlanTab | null {
  if (!data) return null;
  if (activeTab === 'estructurado' && data.estructuradoPlan) return 'estructurado';
  if (activeTab === 'libre' && data.librePlan) return 'libre';
  if (data.estructuradoPlan && hasNutritionPlanData(data.estructuradoPlan)) return 'estructurado';
  if (data.librePlan && hasNutritionPlanData(data.librePlan)) return 'libre';
  if (data.estructuradoPlan) return 'estructurado';
  if (data.librePlan) return 'libre';
  return null;
}
