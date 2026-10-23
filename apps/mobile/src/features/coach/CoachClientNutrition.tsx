import { MacroTargetBars } from '@trainerpro/ui';
import {
  buildDayMacros,
  compareToTarget,
  readPlanSetup,
  resolvePlanDay,
  type CoachNutritionMeal as NutritionMeal,
  type CoachNutritionPlan as NutritionPlan,
} from '@trainerpro/shared';
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCoachQuery } from '../../data/hooks/useCoachData';
import { ui } from './CoachUi';

type Adherence = { summary: { done: number; expected: number; percent: number | null } };

export function CoachClientNutrition({ clientId }: { clientId: string }): React.JSX.Element | null {
  const { t } = useTranslation();
  const plans = useCoachQuery<{ items: NutritionPlan[] }>(`/nutrition/clients/${clientId}/plans`);
  const meals = useCoachQuery<{ items: NutritionMeal[] }>('/nutrition/meals');
  const range = recentRange(7);
  const adherence = useCoachQuery<Adherence>(`/nutrition/clients/${clientId}/adherence?from=${range.from}&to=${range.to}`);
  const plan = plans.data?.items.find((item) => item.type === 'ESTRUCTURADO') ?? plans.data?.items[0];
  if (!plan) return null;
  const day = resolvePlanDay(plan, plan.assignedAt, new Date());
  const macros = buildDayMacros(day, meals.data?.items ?? [], []);
  const summary = adherence.data?.summary;
  return (
    <View style={ui.card}>
      <Text style={ui.title}>{t('coach.nutrition.clientToday')}</Text>
      <Text style={ui.label}>{plan.name}</Text>
      <MacroTargetBars comparison={compareToTarget(macros.total, readPlanSetup(plan.setupData))} t={t} />
      <Text style={ui.muted}>
        {t('coach.nutrition.adherence7', {
          done: summary?.done ?? 0,
          expected: summary?.expected ?? 0,
          percent: summary?.percent ?? 0,
        })}
      </Text>
    </View>
  );
}

function recentRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  return { from: dateKey(from), to: dateKey(to) };
}

function dateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
