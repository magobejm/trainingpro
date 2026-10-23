import React from 'react';
import { View } from 'react-native';
import type { CoachNutritionMeal as NutritionMeal, CoachPlanWriteInput as PlanWriteInput } from '@trainerpro/shared';
import { CoachButton, CoachField, CoachSelect, CoachStatus } from './CoachUi';
import { CoachPdfButton } from './CoachPdfButton';
import { NutritionSetupEditor } from './coach-nutrition-setup';
import { FreeNutritionContent, StructuredNutritionContent } from './coach-nutrition-content';
import { useNutritionCopy } from './coach-nutrition-copy';
import { nutritionDocument } from './coach-nutrition-model';

export type PlanStep = 'assign' | 'content' | 'goal';

export function PlanStepBar(props: { onChange: (step: PlanStep) => void; step: PlanStep }): React.JSX.Element {
  const c = useNutritionCopy();
  return (
    <View>
      <CoachButton label={c('stepGoal')} onPress={() => props.onChange('goal')} />
      <CoachButton label={c('stepContent')} onPress={() => props.onChange('content')} />
      <CoachButton label={c('stepAssign')} onPress={() => props.onChange('assign')} />
    </View>
  );
}

export function PlanGoalFields(props: {
  onChange: (patch: Partial<PlanWriteInput>) => void;
  value: PlanWriteInput;
}): React.JSX.Element {
  const c = useNutritionCopy();
  return (
    <>
      <CoachField label={c('name')} onChange={(name) => props.onChange({ name })} value={props.value.name} />
      <CoachField
        label={c('description')}
        multiline
        onChange={(description) => props.onChange({ description })}
        value={props.value.description ?? ''}
      />
      <CoachField
        label={c('strategy')}
        onChange={(strategy) => props.onChange({ strategy })}
        value={props.value.strategy ?? ''}
      />
      <CoachSelect
        label={c('type')}
        onChange={(type) => props.onChange({ type: type as PlanWriteInput['type'] })}
        options={[
          { label: c('structured'), value: 'ESTRUCTURADO' },
          { label: c('free'), value: 'LIBRE' },
        ]}
        value={props.value.type}
      />
      <NutritionSetupEditor onChange={(setupData) => props.onChange({ setupData })} value={props.value.setupData} />
    </>
  );
}

export function PlanContentFields(props: {
  meals: NutritionMeal[];
  mealsQuery: { data?: { items: NutritionMeal[] }; isError: boolean; isLoading: boolean; refetch: () => unknown };
  onChange: (patch: Partial<PlanWriteInput>) => void;
  value: PlanWriteInput;
}): React.JSX.Element {
  const c = useNutritionCopy();
  return (
    <>
      <CoachStatus query={props.mealsQuery} />
      {props.value.type === 'ESTRUCTURADO' ? (
        <StructuredNutritionContent
          meals={props.meals}
          onChange={(content) => props.onChange({ content })}
          value={props.value.content}
        />
      ) : (
        <FreeNutritionContent
          meals={props.meals}
          onChange={(content) => props.onChange({ content })}
          value={props.value.content}
        />
      )}
      <CoachPdfButton sections={nutritionDocument(props.value, props.meals)} title={props.value.name || c('nutrition')} />
    </>
  );
}
