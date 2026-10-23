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
import { CheckpointsModal } from './nutrition/CheckpointsModal';
import { ClientNutritionToday } from './nutrition/ClientNutritionToday';
import { readSetupData } from './nutrition/nutrition-tdee.utils';
import type { FreePlanContent, NutritionPlan, NutritionPlanType, StructuredPlanContent } from './nutrition/nutrition.types';
import { styles } from './nutrition/nutrition.styles';
import { Button, EmptyState, space, useToast } from '@trainerpro/ui';

const VARIANT_SECONDARY = 'secondary' as const;
const SIZE_SM = 'sm' as const;

type Props = {
  clientId: string;
  clientName: string;
  onBack: () => void;
};

// eslint-disable-next-line max-lines-per-function
export function ClientNutritionPlanScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const plansQuery = useClientNutritionPlansQuery(props.clientId);
  const mealsQuery = useNutritionMealsQuery();
  const foodsQuery = useLibraryFoodsQuery({ query: '' });
  const templatesQuery = useNutritionPlansQuery();
  const assignMutation = useAssignPlanMutation();
  const toast = useToast();
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
      <Button
        label={t('common.back')}
        onPress={props.onBack}
        size={SIZE_SM}
        style={{ alignSelf: 'flex-start' }}
        variant={VARIANT_SECONDARY}
      />
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
      {plansQuery.isLoading ? <LoadingState label={t('coach.nutrition.loading')} /> : null}
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
          <ClientNutritionToday foods={foodsQuery.data ?? []} meals={mealsQuery.data ?? []} plan={activePlan} t={t} />
          <Text style={styles.sectionTitle}>{activePlan.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <ClientPreviewButton isDraft={false}>
              <NutritionClientPreview plan={activePlan} meals={mealsQuery.data} />
            </ClientPreviewButton>
            <NutritionPdfButton
              plan={activePlan}
              meals={mealsQuery.data ?? []}
              isDraft={false}
              clientName={props.clientName}
              disabled={mealsQuery.isLoading || mealsQuery.isError}
            />
          </View>
          {planType === 'LIBRE' ? <FreePlanReadOnly content={activePlan.content} t={t} /> : null}
          {planType === 'ESTRUCTURADO' ? <StructuredPlanReadOnly content={activePlan.content} t={t} /> : null}
          <Button label={t('coach.nutrition.checkpoints.open')} onPress={() => setCheckpointPlan(activePlan)} />
        </>
      ) : null}
      {!activePlan && !plansQuery.isLoading ? (
        <EmptyState icon={<EmptyIllustration kind={'library'} />} title={t('coach.nutrition.client.empty')} />
      ) : null}
      <Text style={styles.sectionTitle}>{t('coach.nutrition.client.libraryTitle')}</Text>
      {templatesQuery.isLoading ? <LoadingState label={t('coach.nutrition.loading')} /> : null}
      {templates.length === 0 && !templatesQuery.isLoading ? (
        <EmptyState icon={<EmptyIllustration kind={'library'} />} title={t('coach.nutrition.client.libraryEmpty')} />
      ) : null}
      {templates.map((plan) => (
        <View key={plan.id} style={styles.card}>
          <Text style={styles.cardTitle}>{plan.name}</Text>
          <Text style={styles.cardMuted}>
            {plan.type === 'LIBRE' ? t('coach.nutrition.plans.free') : t('coach.nutrition.plans.structured')}
          </Text>
          <Button
            disabled={assigning || activePlan?.sourcePlanId === plan.id}
            label={
              activePlan?.sourcePlanId === plan.id
                ? t('coach.nutrition.client.assigned')
                : activePlan
                  ? t('coach.nutrition.client.replace')
                  : t('coach.nutrition.client.assign')
            }
            loading={assigning && assignMutation.variables?.planId === plan.id}
            onPress={() =>
              assignMutation.mutate(
                { clientId: props.clientId, planId: plan.id },
                {
                  onError: () => toast.error(t('coach.nutrition.client.assignError')),
                  onSuccess: () => toast.success(t('coach.nutrition.client.assignedToast')),
                },
              )
            }
          />
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
  if (columns.length === 0)
    return <EmptyState icon={<EmptyIllustration kind={'library'} />} title={props.t('coach.nutrition.client.noContent')} />;
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
  if (content.weeks.length === 0)
    return <EmptyState icon={<EmptyIllustration kind={'library'} />} title={props.t('coach.nutrition.client.noContent')} />;
  return (
    <>
      {content.weeks.map((week) => (
        <View key={week.id} style={styles.card}>
          <Text style={styles.cardTitle}>{week.label}</Text>
          {week.days.map((day) => (
            <View key={day.id} style={{ marginTop: space.sm }}>
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
