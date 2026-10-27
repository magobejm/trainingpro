import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  buildDayMacros,
  compareToTarget,
  readPlanSetup,
  readSetupData,
  resolvePlanDay,
  shiftPlanDate,
  type ClientNutrition,
  type DayMealMacros,
  type FoodMacroSource,
  type MealMacroSource,
  type NutritionPlan,
} from '@trainerpro/shared';
import {
  Button,
  ClientNutritionMacrosCard,
  ConsiderationBadges,
  DayMealsList,
  MacroTargetBars,
  clientPlanLight as LIGHT,
} from '@trainerpro/ui';
import { LoadingState } from '../../components/AsyncStatus';
import { useLibraryFoodsQuery } from '../../data/hooks/useLibraryQuery';

type Plan = Pick<NutritionPlan, 'name' | 'type' | 'content' | 'setupData'> & Partial<Pick<NutritionPlan, 'description'>>;
type Translate = (key: string, options?: Record<string, unknown>) => string;
type View_ = 'plan' | 'today';
type WeekDay = { key: string; label: string; meals: DayMealMacros[] };

/** Réplica de la pantalla de nutrición del cliente en la app móvil: pestañas Hoy / Plan completo. */
export function NutritionClientPreview(props: {
  foods?: ClientNutrition['foods'];
  meals?: ClientNutrition['meals'];
  plan: Plan;
}): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const libraryFoods = useLibraryFoodsQuery({});
  const [view, setView] = useState<View_>('today');
  const [day, setDay] = useState(() => new Date());
  const foods = (props.foods ?? libraryFoods.data ?? []) as FoodMacroSource[];
  const meals = (props.meals ?? []) as MealMacroSource[];
  const plan = useMemo(() => ({ ...props.plan, assignedAt: assignedAnchor(props.plan) }), [props.plan]);
  if (!props.foods && libraryFoods.isPending) return <LoadingState label={t('common.loading')} />;
  if (!props.foods && libraryFoods.isError) {
    return (
      <View style={styles.block}>
        <Text style={styles.description}>{t('common.error')}</Text>
        <Button label={t('common.retry')} onPress={() => void libraryFoods.refetch()} />
      </View>
    );
  }
  const setup = readSetupData(props.plan.setupData);
  return (
    <View style={styles.root}>
      <Toggle onChange={setView} t={t} view={view} />
      <Text style={styles.planName}>{props.plan.name || t('coach.clientPreview.empty')}</Text>
      {view === 'plan' && props.plan.description ? <Text style={styles.description}>{props.plan.description}</Text> : null}
      {view === 'plan' && setup ? <ClientNutritionMacrosCard setup={setup} t={t} /> : null}
      {view === 'today' ? (
        <TodayPanel
          date={day}
          foods={foods}
          meals={meals}
          onReset={() => setDay(new Date())}
          onShift={(days) => setDay((current) => shiftPlanDate(current, days))}
          plan={plan}
          t={t}
        />
      ) : (
        <WeekPlan foods={foods} locale={i18n.language} meals={meals} plan={plan} t={t} />
      )}
    </View>
  );
}

type PlanWithAssignment = Plan & { assignedAt: string };

/** Sin fecha de asignación (plantilla), el día 1 del plan es hoy. */
function assignedAnchor(plan: Plan): string {
  const assigned = (plan as { assignedAt?: Date | string | null }).assignedAt;
  return assigned ? new Date(assigned).toISOString() : new Date().toISOString();
}

function TodayPanel(props: {
  date: Date;
  foods: FoodMacroSource[];
  meals: MealMacroSource[];
  onReset: () => void;
  onShift: (days: number) => void;
  plan: PlanWithAssignment;
  t: Translate;
}): React.JSX.Element {
  const resolved = resolvePlanDay(props.plan, props.plan.assignedAt, props.date);
  const macros = buildDayMacros(resolved, props.meals, props.foods);
  const isToday = dayDiff(props.date) === 0;
  return (
    <>
      <View style={styles.dayRow}>
        <Pressable onPress={() => props.onShift(-1)} style={styles.dayButton}>
          <Text style={styles.dayLabel}>{props.t('client.nutrition.previousDay')}</Text>
        </Pressable>
        <Text style={styles.dayLabel}>{dayHeading(props.date, props.t)}</Text>
        <Pressable onPress={() => props.onShift(1)} style={styles.dayButton}>
          <Text style={styles.dayLabel}>{props.t('client.nutrition.nextDay')}</Text>
        </Pressable>
      </View>
      {isToday ? null : (
        <Pressable onPress={props.onReset}>
          <Text style={styles.backToday}>{props.t('client.nutrition.backToToday')}</Text>
        </Pressable>
      )}
      <Text style={styles.dayLabel}>{props.t('client.nutrition.plannedTitle')}</Text>
      <MacroTargetBars comparison={compareToTarget(macros.total, readPlanSetup(props.plan.setupData))} t={props.t} />
      {resolved.empty ? (
        <Text style={styles.empty}>{props.t('client.nutrition.noMealsToday')}</Text>
      ) : (
        <DayMealsList meals={macros.meals} t={props.t} />
      )}
    </>
  );
}

function WeekPlan(props: {
  foods: FoodMacroSource[];
  locale: string;
  meals: MealMacroSource[];
  plan: PlanWithAssignment;
  t: Translate;
}): React.JSX.Element {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const days = weekDays(props.plan, props.meals, props.foods, props.locale);
  return (
    <>
      {days.map((day) => (
        <View key={day.key} style={styles.card}>
          <Text style={styles.cardTitle}>{day.label}</Text>
          {day.meals.length === 0 ? <Text style={styles.empty}>{props.t('client.nutrition.noMealsToday')}</Text> : null}
          {day.meals.map((meal) => {
            const rowKey = `${day.key}:${meal.key}`;
            return (
              <View key={meal.key}>
                <Pressable onPress={() => setOpenKey((current) => (current === rowKey ? null : rowKey))}>
                  <Text style={styles.item}>{mealHeading(meal, props.t)}</Text>
                </Pressable>
                {openKey === rowKey ? <DayMealsList meals={[meal]} showTitle={false} t={props.t} /> : null}
                {openKey === rowKey ? (
                  <ConsiderationBadges items={mealNotes(meal, props.meals, props.foods)} t={props.t} />
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </>
  );
}

function Toggle(props: { onChange: (view: View_) => void; t: Translate; view: View_ }): React.JSX.Element {
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

function ToggleButton(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.toggleBtn, props.active && styles.toggleBtnActive]}>
      <Text style={[styles.toggleText, props.active && styles.toggleTextActive]}>{props.label}</Text>
    </Pressable>
  );
}

function weekDays(plan: PlanWithAssignment, meals: MealMacroSource[], foods: FoodMacroSource[], locale: string): WeekDay[] {
  const start = mondayOf(new Date());
  return [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const date = shiftPlanDate(start, offset);
    const resolved = resolvePlanDay(plan, plan.assignedAt, date);
    return {
      key: String(offset),
      label: resolved.dayLabel ?? date.toLocaleDateString(locale, { day: 'numeric', month: 'short', weekday: 'long' }),
      meals: buildDayMacros(resolved, meals, foods).meals,
    };
  });
}

function mealHeading(meal: DayMealMacros, t: Translate): string {
  const key = meal.category ? `client.nutrition.category.${meal.category}` : '';
  const translated = key ? t(key) : meal.name;
  const name = key && translated === key ? meal.name : translated;
  return meal.time ? `${name} · ${meal.time}` : name;
}

function mealNotes(meal: DayMealMacros, meals: MealMacroSource[], foods: FoodMacroSource[]) {
  const withNotes = meals as Array<MealMacroSource & { considerations?: never[] }>;
  const fromMeal = withNotes.find((candidate) => candidate.name === meal.name)?.considerations ?? [];
  if (fromMeal.length > 0) return fromMeal;
  const withFoodNotes = foods as Array<FoodMacroSource & { considerations?: never[] }>;
  return meal.items.flatMap((item) => withFoodNotes.find((food) => food.id === item.foodId)?.considerations ?? []);
}

function mondayOf(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = start.getDay();
  start.setDate(start.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return start;
}

function dayDiff(date: Date): number {
  const today = new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((start - base) / 86_400_000);
}

function dayHeading(date: Date, t: Translate): string {
  const diff = dayDiff(date);
  if (diff === 0) return t('client.nutrition.dayToday');
  if (diff === 1) return t('client.nutrition.dayTomorrow');
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'long' });
}

const styles = StyleSheet.create({
  backToday: { color: LIGHT.accentDark, fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  block: { padding: 16 },
  card: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 12,
  },
  cardTitle: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  dayButton: { paddingHorizontal: 12, paddingVertical: 8 },
  dayLabel: { color: LIGHT.textStrong, flex: 1, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  dayRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 12, marginHorizontal: 16 },
  description: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12, marginHorizontal: 16 },
  empty: { color: LIGHT.textMuted, fontSize: 14, paddingVertical: 12, textAlign: 'center' },
  item: { color: LIGHT.textStrong, fontSize: 14, paddingVertical: 6 },
  planName: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800', marginBottom: 8, marginHorizontal: 16 },
  root: { paddingVertical: 12 },
  toggleBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  toggleBtnActive: { backgroundColor: LIGHT.accent, borderColor: LIGHT.accent },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16, marginHorizontal: 16, marginTop: 8 },
  toggleText: { color: LIGHT.textMuted, fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: LIGHT.textOnNavy },
});
