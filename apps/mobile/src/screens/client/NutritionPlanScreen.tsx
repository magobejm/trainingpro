import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientNutritionQuery, type NutritionPlan } from '../../data/hooks/useClientNutrition';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { hasNutritionPlanData } from './nutrition-plan.helpers';
import { NutritionWeekPlan } from './NutritionWeekPlan';
import { moveNutritionDay, NutritionTodayPanel } from './NutritionTodayPanel';
import { styles } from './nutrition-plan.styles';
import { LIGHT } from '../../theme/light';

type Props = { onClose: () => void; onOpenShopping: () => void };
type PlanTab = 'estructurado' | 'libre';
type ScreenView = 'plan' | 'today';

const SPINNER_SIZE = 'large' as const;

export function NutritionPlanScreen({ onClose, onOpenShopping }: Props): React.JSX.Element {
  const { i18n, t } = useTranslation();
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
          locale={i18n.language}
          resolvedTab={resolvedTab}
          setActiveTab={setActiveTab}
          setDay={setDay}
          setView={setView}
          t={t}
          view={view}
          onOpenShopping={onOpenShopping}
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
  locale: string;
  setDay: (date: Date) => void;
  setView: (view: ScreenView) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  view: ScreenView;
  onOpenShopping: () => void;
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
      <Pressable onPress={props.onOpenShopping} style={styles.shoppingButton}>
        <Text style={styles.toggleTextActive}>{props.t('client.nutrition.shopping')}</Text>
      </Pressable>
      {props.view === 'today' ? (
        <NutritionTodayPanel
          data={props.query.data}
          date={props.day}
          onReset={() => props.setDay(new Date())}
          onShift={props.onShift}
          plan={props.activePlan}
          t={props.t}
        />
      ) : (
        <NutritionWeekPlan
          foods={props.query.data.foods}
          locale={props.locale}
          meals={props.query.data.meals}
          plan={props.activePlan}
          t={props.t}
        />
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
