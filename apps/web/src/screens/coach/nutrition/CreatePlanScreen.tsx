import { EmptyIllustration } from '../../../components/EmptyIllustrations';
import { LoadingState } from '../../../components/AsyncStatus';
import { colors } from '@trainerpro/ui';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LayoutGrid, List } from 'lucide-react';
import { useLibraryFoodsQuery } from '../../../data/hooks/useLibraryQuery';
import { useNutritionMealsQuery, useNutritionPlansQuery } from '../../../data/hooks/useNutrition';
import type { Crumb } from '../../../layout/crumbs';
import { NutritionCrumbBar } from './nutrition-crumbs';
import { PlanContentView } from './PlanContentView';
import { styles } from './nutrition.styles';
import { Button, EmptyState } from '@trainerpro/ui';
import type { NutritionPlanType } from './nutrition.types';

type Props = {
  crumbs: Crumb[];
  onOpenPlan: (planId: string, type: NutritionPlanType) => void;
  onStartWizard: (type: NutritionPlanType) => void;
};

export function CreatePlanScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const plansQuery = useNutritionPlansQuery();
  const mealsQuery = useNutritionMealsQuery();
  const foodsQuery = useLibraryFoodsQuery({ query: '' });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const plans = plansQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <NutritionCrumbBar crumbs={props.crumbs} label={t('app.breadcrumb')} />
      <Text style={styles.headerTitle}>{t('coach.nutrition.plans.title')}</Text>
      <Text style={styles.headerSubtitle}>{t('coach.nutrition.plans.subtitle')}</Text>
      <View style={styles.actionRow}>
        <Pressable onPress={() => props.onStartWizard('LIBRE')} style={styles.actionCircle}>
          <View style={styles.iconCircle}>
            <LayoutGrid color={colors.primary} size={24} />
          </View>
          <Text style={styles.actionCircleLabel}>{t('coach.nutrition.plans.free')}</Text>
        </Pressable>
        <Pressable onPress={() => props.onStartWizard('ESTRUCTURADO')} style={styles.actionCircle}>
          <View style={styles.iconCircle}>
            <List color={colors.primary} size={24} />
          </View>
          <Text style={styles.actionCircleLabel}>{t('coach.nutrition.plans.structured')}</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionTitle}>{t('coach.nutrition.plans.saved')}</Text>
      {plansQuery.isLoading ? <LoadingState label={t('coach.nutrition.loading')} /> : null}
      {plans.length === 0 && !plansQuery.isLoading ? (
        <EmptyState icon={<EmptyIllustration kind={'library'} />} title={t('coach.nutrition.plans.empty')} />
      ) : null}
      {plans.map((plan) => (
        <View key={plan.id} style={styles.card}>
          <Text style={styles.cardTitle}>{plan.name}</Text>
          <Text style={styles.cardMuted}>
            {plan.type === 'LIBRE' ? t('coach.nutrition.plans.free') : t('coach.nutrition.plans.structured')}
          </Text>
          <Button
            label={previewId === plan.id ? t('coach.nutrition.client.hideContent') : t('coach.nutrition.client.viewContent')}
            onPress={() => setPreviewId((current) => (current === plan.id ? null : plan.id))}
            size="sm"
            style={styles.addButton}
            variant="secondary"
          />
          <Button
            label={t('coach.nutrition.plans.open')}
            onPress={() => props.onOpenPlan(plan.id, plan.type)}
            size="sm"
            style={styles.addButton}
            variant="ghost"
          />
          {previewId === plan.id ? (
            <PlanContentView
              content={plan.content}
              foods={foodsQuery.data ?? []}
              meals={mealsQuery.data ?? []}
              t={t}
              type={plan.type}
            />
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
