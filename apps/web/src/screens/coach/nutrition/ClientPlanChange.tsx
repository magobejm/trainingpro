import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, EmptyState } from '@trainerpro/ui';
import { EmptyIllustration } from '../../../components/EmptyIllustrations';
import { PlanContentView } from './PlanContentView';
import { clientPlanStyles as s } from './client-plan.styles';
import { styles } from './nutrition.styles';
import type { NutritionMeal, NutritionPlan, NutritionPlanType } from './nutrition.types';

type Translate = (key: string, options?: Record<string, unknown>) => string;

type Props = {
  assigning: boolean;
  assignedSourceIds: string[];
  assigningPlanId?: string;
  foods: Array<{ id: string; servingUnit?: string | null }>;
  hasAssigned: boolean;
  initialType: NutritionPlanType;
  meals: NutritionMeal[];
  onAssign: (planId: string) => void;
  onCreate: (type: NutritionPlanType) => void;
  t: Translate;
  templates: NutritionPlan[];
};

/** Elegir tipo (libre o estructurado) y después crear un plan nuevo o reutilizar uno existente. */
export function ClientPlanChange(props: Props): React.JSX.Element {
  const [type, setType] = useState<NutritionPlanType>(props.initialType);
  const [previewId, setPreviewId] = useState<null | string>(null);
  const options = props.templates.filter((plan) => plan.type === type);
  const typeLabel = type === 'LIBRE' ? props.t('coach.nutrition.plans.free') : props.t('coach.nutrition.plans.structured');
  return (
    <View style={s.card}>
      <Text style={s.section}>{props.t('coach.nutrition.client.changeTitle')}</Text>
      <Text style={s.muted}>{props.t('coach.nutrition.client.chooseType')}</Text>
      <View style={s.chipRow}>
        <TypeChip active={type === 'LIBRE'} label={props.t('coach.nutrition.plans.free')} onPress={() => setType('LIBRE')} />
        <TypeChip
          active={type === 'ESTRUCTURADO'}
          label={props.t('coach.nutrition.plans.structured')}
          onPress={() => setType('ESTRUCTURADO')}
        />
      </View>
      <Button
        label={props.t('coach.nutrition.client.createOfType', { type: typeLabel })}
        onPress={() => props.onCreate(type)}
        style={{ alignSelf: 'flex-start' }}
      />
      <Text style={s.section}>{props.t('coach.nutrition.client.useExisting', { type: typeLabel })}</Text>
      {options.length === 0 ? (
        <EmptyState icon={<EmptyIllustration kind={'library'} />} title={props.t('coach.nutrition.client.libraryEmpty')} />
      ) : null}
      {options.map((plan) => {
        const current = props.assignedSourceIds.includes(plan.id);
        return (
          <View key={plan.id} style={styles.card}>
            <Text style={styles.cardTitle}>{plan.name}</Text>
            <View style={s.row}>
              <Button
                label={
                  previewId === plan.id
                    ? props.t('coach.nutrition.client.hideContent')
                    : props.t('coach.nutrition.client.viewContent')
                }
                onPress={() => setPreviewId((id) => (id === plan.id ? null : plan.id))}
                size="sm"
                variant="secondary"
              />
              <Button
                disabled={props.assigning || current}
                label={assignLabel(props, current)}
                loading={props.assigning && props.assigningPlanId === plan.id}
                onPress={() => props.onAssign(plan.id)}
                size="sm"
              />
            </View>
            {previewId === plan.id ? (
              <PlanContentView content={plan.content} foods={props.foods} meals={props.meals} t={props.t} type={plan.type} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function assignLabel(props: Props, current: boolean): string {
  if (current) return props.t('coach.nutrition.client.assigned');
  return props.hasAssigned ? props.t('coach.nutrition.client.replace') : props.t('coach.nutrition.client.assign');
}

function TypeChip(props: { active: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.chip, props.active && styles.chipActive]}>
      <Text style={[styles.chipLabel, props.active && styles.chipLabelActive]}>{props.label}</Text>
    </Pressable>
  );
}
