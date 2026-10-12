import { colors } from '@trainerpro/ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LayoutGrid, List } from 'lucide-react';
import { useNutritionPlansQuery } from '../../../data/hooks/useNutrition';
import { styles } from './nutrition.styles';
import { Button, EmptyState } from '@trainerpro/ui';
import type { NutritionPlanType } from './nutrition.types';

type Props = {
  onBack: () => void;
  onOpenPlan: (planId: string, type: NutritionPlanType) => void;
  onStartWizard: (type: NutritionPlanType) => void;
};

export function CreatePlanScreen(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const plansQuery = useNutritionPlansQuery();
  const plans = plansQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button label={t('common.back')} onPress={props.onBack} size="sm" style={styles.backButton} variant="secondary" />
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
      {plansQuery.isLoading ? <EmptyState title={t('coach.nutrition.loading')} /> : null}
      {plans.length === 0 && !plansQuery.isLoading ? <EmptyState title={t('coach.nutrition.plans.empty')} /> : null}
      {plans.map((plan) => (
        <Pressable key={plan.id} onPress={() => props.onOpenPlan(plan.id, plan.type)} style={styles.card}>
          <Text style={styles.cardTitle}>{plan.name}</Text>
          <Text style={styles.cardMuted}>
            {plan.type === 'LIBRE' ? t('coach.nutrition.plans.free') : t('coach.nutrition.plans.structured')}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
