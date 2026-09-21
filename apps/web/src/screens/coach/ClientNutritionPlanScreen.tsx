import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAssignPlanMutation, useClientNutritionPlansQuery, useNutritionPlansQuery } from '../../data/hooks/useNutrition';
import { CheckpointsModal } from './nutrition/CheckpointsModal';
import { readSetupData } from './nutrition/nutrition-tdee.utils';
import type { FreePlanContent, NutritionPlan, NutritionPlanType, StructuredPlanContent } from './nutrition/nutrition.types';
import { styles } from './nutrition/nutrition.styles';

type Props = {
  clientId: string;
  clientName: string;
  onBack: () => void;
};

// eslint-disable-next-line max-lines-per-function
export function ClientNutritionPlanScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const plansQuery = useClientNutritionPlansQuery(props.clientId);
  const templatesQuery = useNutritionPlansQuery();
  const assignMutation = useAssignPlanMutation();
  const [planType, setPlanType] = useState<NutritionPlanType>('LIBRE');
  const [checkpointPlan, setCheckpointPlan] = useState<null | NutritionPlan>(null);
  const plans = plansQuery.data ?? [];
  const activePlan = useMemo(() => resolveActivePlan(plans, planType), [plans, planType]);
  const templates = useMemo(
    () => (templatesQuery.data ?? []).filter((plan) => plan.type === planType),
    [planType, templatesQuery.data],
  );
  const setup = readSetupData(activePlan?.setupData);
  const assigning = assignMutation.isPending;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={props.onBack} style={styles.backButton}>
        <Text style={styles.backLabel}>{t('common.back')}</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{props.clientName}</Text>
      <Text style={styles.headerSubtitle}>{t('coach.nutrition.client.title')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <TypeChip
          active={planType === 'LIBRE'}
          label={t('coach.nutrition.plans.free')}
          onPress={() => setPlanType('LIBRE')}
        />
        <TypeChip
          active={planType === 'ESTRUCTURADO'}
          label={t('coach.nutrition.plans.structured')}
          onPress={() => setPlanType('ESTRUCTURADO')}
        />
      </View>
      {plansQuery.isLoading ? <Text style={styles.empty}>{t('coach.nutrition.loading')}</Text> : null}
      {setup ? (
        <View style={styles.macroRow}>
          <View style={styles.macroBar}>
            <Text style={styles.macroLabel}>{t('coach.nutrition.macros.calories')}</Text>
            <Text style={styles.macroValue}>{setup.targetCalories}</Text>
          </View>
          <View style={styles.macroBar}>
            <Text style={styles.macroLabel}>{t('coach.nutrition.macros.protein')}</Text>
            <Text style={styles.macroValue}>{t('coach.nutrition.macros.grams', { value: setup.proteinG })}</Text>
          </View>
          <View style={styles.macroBar}>
            <Text style={styles.macroLabel}>{t('coach.nutrition.macros.carbs')}</Text>
            <Text style={styles.macroValue}>{t('coach.nutrition.macros.grams', { value: setup.carbsG })}</Text>
          </View>
          <View style={styles.macroBar}>
            <Text style={styles.macroLabel}>{t('coach.nutrition.macros.fat')}</Text>
            <Text style={styles.macroValue}>{t('coach.nutrition.macros.grams', { value: setup.fatG })}</Text>
          </View>
        </View>
      ) : null}
      {activePlan ? (
        <>
          <Text style={styles.sectionTitle}>{activePlan.name}</Text>
          {planType === 'LIBRE' ? <FreePlanReadOnly content={activePlan.content} t={t} /> : null}
          {planType === 'ESTRUCTURADO' ? <StructuredPlanReadOnly content={activePlan.content} t={t} /> : null}
          <Pressable onPress={() => setCheckpointPlan(activePlan)} style={styles.ctaButton}>
            <Text style={styles.ctaLabel}>{t('coach.nutrition.checkpoints.open')}</Text>
          </Pressable>
        </>
      ) : null}
      {!activePlan && !plansQuery.isLoading ? <Text style={styles.empty}>{t('coach.nutrition.client.empty')}</Text> : null}
      <Text style={styles.sectionTitle}>{t('coach.nutrition.client.libraryTitle')}</Text>
      {templatesQuery.isLoading ? <Text style={styles.empty}>{t('coach.nutrition.loading')}</Text> : null}
      {assignMutation.isError ? <Text style={styles.empty}>{t('coach.nutrition.client.assignError')}</Text> : null}
      {templates.length === 0 && !templatesQuery.isLoading ? (
        <Text style={styles.empty}>{t('coach.nutrition.client.libraryEmpty')}</Text>
      ) : null}
      {templates.map((plan) => (
        <View key={plan.id} style={styles.card}>
          <Text style={styles.cardTitle}>{plan.name}</Text>
          <Text style={styles.cardMuted}>
            {plan.type === 'LIBRE' ? t('coach.nutrition.plans.free') : t('coach.nutrition.plans.structured')}
          </Text>
          <Pressable
            disabled={assigning || activePlan?.sourcePlanId === plan.id}
            onPress={() => void assignMutation.mutateAsync({ clientId: props.clientId, planId: plan.id })}
            style={[styles.ctaButton, (assigning || activePlan?.sourcePlanId === plan.id) && { opacity: 0.5 }]}
          >
            <Text style={styles.ctaLabel}>
              {activePlan?.sourcePlanId === plan.id
                ? t('coach.nutrition.client.assigned')
                : activePlan
                  ? t('coach.nutrition.client.replace')
                  : t('coach.nutrition.client.assign')}
            </Text>
          </Pressable>
        </View>
      ))}
      {checkpointPlan ? (
        <CheckpointsModal onClose={() => setCheckpointPlan(null)} plan={checkpointPlan} visible={Boolean(checkpointPlan)} />
      ) : null}
    </ScrollView>
  );
}

function TypeChip(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.chip, props.active && styles.chipActive]}>
      <Text style={[styles.chipLabel, props.active && styles.chipLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}

function resolveActivePlan(plans: NutritionPlan[], type: NutritionPlanType): NutritionPlan | undefined {
  return plans.find((plan) => plan.type === type);
}

function FreePlanReadOnly(props: {
  content: unknown;
  t: (key: string, params?: Record<string, number | string>) => string;
}): React.JSX.Element {
  const content = (props.content as FreePlanContent | undefined) ?? { columns: {} };
  const columns = Object.entries(content.columns ?? {});
  if (columns.length === 0) return <Text style={styles.empty}>{props.t('coach.nutrition.client.noContent')}</Text>;
  return (
    <>
      {columns.map(([column, items]) => (
        <View key={column} style={styles.card}>
          <Text style={styles.cardTitle}>{props.t(`coach.nutrition.categories.${column}`, { defaultValue: column })}</Text>
          {items.map((item) => (
            <Text key={item.id} style={styles.cardMuted}>
              {item.mealName ?? item.foodName ?? '—'}
            </Text>
          ))}
        </View>
      ))}
    </>
  );
}

function StructuredPlanReadOnly(props: {
  content: unknown;
  t: (key: string, params?: Record<string, number | string>) => string;
}): React.JSX.Element {
  const content = (props.content as StructuredPlanContent | undefined) ?? { weeks: [] };
  if (content.weeks.length === 0) return <Text style={styles.empty}>{props.t('coach.nutrition.client.noContent')}</Text>;
  return (
    <>
      {content.weeks.map((week) => (
        <View key={week.id} style={styles.card}>
          <Text style={styles.cardTitle}>{week.label}</Text>
          {week.days.map((day) => (
            <View key={day.id} style={{ marginTop: 8 }}>
              <Text style={styles.cardMuted}>{day.label}</Text>
              {day.meals.map((meal) => (
                <Text key={meal.id} style={styles.cardTitle}>
                  {meal.name}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ))}
    </>
  );
}
