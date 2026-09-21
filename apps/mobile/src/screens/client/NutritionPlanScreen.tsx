import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientNutritionQuery, type NutritionPlan } from '../../data/hooks/useClientNutrition';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import {
  buildMealGroups,
  hasNutritionPlanData,
  readSetupData,
  type MealCategoryGroup,
  type PlanSetupData,
} from './nutrition-plan.helpers';
import { LIGHT } from '../../theme/light';
import { SCREEN } from '../../theme/sessionStyles';

type Props = { onClose: () => void };

type PlanTab = 'estructurado' | 'libre';

const SPINNER_COLOR = LIGHT.accent;
const SPINNER_SIZE = 'large' as const;

export function NutritionPlanScreen({ onClose }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const query = useClientNutritionQuery();
  const [activeTab, setActiveTab] = useState<PlanTab | null>(null);

  const resolvedTab = useMemo(() => {
    if (!query.data) return null;
    if (activeTab) return activeTab;
    if (query.data.estructuradoPlan && hasNutritionPlanData(query.data.estructuradoPlan)) return 'estructurado';
    if (query.data.librePlan && hasNutritionPlanData(query.data.librePlan)) return 'libre';
    return query.data.estructuradoPlan ? 'estructurado' : query.data.librePlan ? 'libre' : null;
  }, [activeTab, query.data]);

  const activePlan = useMemo(() => {
    if (!query.data || !resolvedTab) return null;
    return resolvedTab === 'estructurado' ? query.data.estructuradoPlan : query.data.librePlan;
  }, [query.data, resolvedTab]);

  const showToggle = Boolean(query.data?.librePlan && query.data?.estructuradoPlan);

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.nutrition.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('client.nutrition.subtitle')}</Text>
        {renderBody(query, activePlan, resolvedTab, showToggle, setActiveTab, t)}
      </ScrollView>
    </View>
  );
}

function renderBody(
  query: ReturnType<typeof useClientNutritionQuery>,
  activePlan: NutritionPlan | null | undefined,
  resolvedTab: PlanTab | null,
  showToggle: boolean,
  setActiveTab: (tab: PlanTab) => void,
  t: (key: string, options?: Record<string, unknown>) => string,
): React.JSX.Element {
  if (query.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={SPINNER_COLOR} size={SPINNER_SIZE} />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{t('client.nutrition.error')}</Text>
      </View>
    );
  }
  if (!activePlan || !resolvedTab) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('client.nutrition.empty')}</Text>
      </View>
    );
  }

  const setup = readSetupData(activePlan.setupData);
  const mealGroups = buildMealGroups(activePlan);

  return (
    <>
      <View style={styles.hint}>
        <Text style={styles.hintText}>{t('client.nutrition.readOnlyHint')}</Text>
      </View>
      {showToggle ? <PlanToggle active={resolvedTab} onChange={setActiveTab} t={t} /> : null}
      {activePlan.name ? <Text style={styles.planName}>{activePlan.name}</Text> : null}
      {activePlan.description ? <Text style={styles.planDescription}>{activePlan.description}</Text> : null}
      {setup ? <MacrosCard setup={setup} t={t} /> : null}
      {mealGroups.length > 0 ? (
        <MealGroupsList groups={mealGroups} t={t} />
      ) : (
        <View style={styles.center}>
          <Text style={styles.empty}>{t('client.nutrition.noMeals')}</Text>
        </View>
      )}
    </>
  );
}

function PlanToggle({
  active,
  onChange,
  t,
}: {
  active: PlanTab;
  onChange: (tab: PlanTab) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.toggleRow}>
      <Pressable onPress={() => onChange('libre')} style={[styles.toggleBtn, active === 'libre' && styles.toggleBtnActive]}>
        <Text style={[styles.toggleText, active === 'libre' && styles.toggleTextActive]}>
          {t('client.nutrition.tabLibre')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('estructurado')}
        style={[styles.toggleBtn, active === 'estructurado' && styles.toggleBtnActive]}
      >
        <Text style={[styles.toggleText, active === 'estructurado' && styles.toggleTextActive]}>
          {t('client.nutrition.tabEstructurado')}
        </Text>
      </Pressable>
    </View>
  );
}

function MacrosCard({ setup, t }: { setup: PlanSetupData; t: (key: string) => string }): React.JSX.Element {
  return (
    <View style={styles.macrosCard}>
      <Text style={styles.macrosTitle}>{t('client.nutrition.macrosTitle')}</Text>
      <View style={styles.macrosRow}>
        {setup.tdee != null ? (
          <MacroPill label={t('client.nutrition.tdee')} value={`${Math.round(setup.tdee)} kcal`} />
        ) : null}
        {setup.targetCalories != null ? (
          <MacroPill label={t('client.nutrition.target')} value={`${Math.round(setup.targetCalories)} kcal`} />
        ) : null}
      </View>
      <View style={styles.macrosRow}>
        {setup.proteinG != null ? (
          <MacroPill label={t('client.nutrition.protein')} value={`${setup.proteinG} g`} accent={LIGHT.indigo} />
        ) : null}
        {setup.carbsG != null ? (
          <MacroPill label={t('client.nutrition.carbs')} value={`${setup.carbsG} g`} accent={LIGHT.accent} />
        ) : null}
        {setup.fatG != null ? (
          <MacroPill label={t('client.nutrition.fat')} value={`${setup.fatG} g`} accent={LIGHT.orange} />
        ) : null}
      </View>
    </View>
  );
}

function MacroPill({
  accent = LIGHT.bgNavy,
  label,
  value,
}: {
  accent?: string;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={[styles.macroPill, { borderColor: accent }]}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

function MealGroupsList({
  groups,
  t,
}: {
  groups: MealCategoryGroup[];
  t: (key: string, options?: Record<string, unknown>) => string;
}): React.JSX.Element {
  return (
    <View style={styles.mealsSection}>
      <Text style={styles.sectionTitle}>{t('client.nutrition.mealsTitle')}</Text>
      {groups.map((group) => (
        <View key={group.category} style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>{formatCategoryLabel(group.category, t)}</Text>
          {group.items.map((item, index) => (
            <View key={`${group.category}-${index}`} style={styles.mealRow}>
              <Text style={styles.mealName}>{item.label}</Text>
              {item.sublabel ? <Text style={styles.mealMeta}>{item.sublabel}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function formatCategoryLabel(category: string, t: (key: string) => string): string {
  const key = `client.nutrition.category.${category}`;
  const translated = t(key);
  return translated === key ? category : translated;
}

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
    padding: 16,
  },
  categoryTitle: {
    color: LIGHT.accentDark,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 160, padding: 24 },
  container: SCREEN.root,
  content: { paddingBottom: 32 },
  empty: { color: LIGHT.textMuted, fontSize: 14, textAlign: 'center' },
  error: { color: LIGHT.error, fontSize: 14, textAlign: 'center' },
  hint: {
    backgroundColor: LIGHT.accentSoft,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusSm,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 12,
  },
  hintText: { color: LIGHT.accentDark, fontSize: 12, textAlign: 'center' },
  macroLabel: { color: LIGHT.textMuted, fontSize: 11, fontWeight: '600' },
  macroPill: {
    backgroundColor: LIGHT.bgSoft,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: '30%',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  macroValue: { color: LIGHT.textStrong, fontSize: 15, fontWeight: '800' },
  macrosCard: {
    backgroundColor: LIGHT.bgNavy,
    borderRadius: LIGHT.radiusXl,
    gap: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
  },
  macrosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macrosTitle: { color: LIGHT.textOnNavy, fontSize: 14, fontWeight: '800' },
  mealMeta: { color: LIGHT.textMuted, fontSize: 12 },
  mealName: { color: LIGHT.textStrong, flex: 1, fontSize: 14, fontWeight: '600' },
  mealRow: {
    alignItems: 'center',
    borderTopColor: LIGHT.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
  },
  mealsSection: { paddingHorizontal: 16 },
  planDescription: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12, marginHorizontal: 16 },
  planName: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800', marginBottom: 4, marginHorizontal: 16 },
  sectionTitle: { color: LIGHT.textStrong, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  subtitle: { color: LIGHT.textMuted, fontSize: 13, marginBottom: 12, paddingHorizontal: 16 },
  toggleBtn: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  toggleBtnActive: {
    backgroundColor: LIGHT.accent,
    borderColor: LIGHT.accent,
  },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16, marginHorizontal: 16 },
  toggleText: { color: LIGHT.textMuted, fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: LIGHT.textOnNavy },
});
