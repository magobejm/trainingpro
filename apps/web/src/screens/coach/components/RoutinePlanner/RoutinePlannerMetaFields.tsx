import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { DraftState } from '../../RoutinePlanner.types';

type ObjectiveOption = { id: string; label: string };

type Props = {
  draft: DraftState;
  isReadOnly: boolean;
  objectiveOptions: ObjectiveOption[];
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  t: (key: string, options?: Record<string, unknown>) => string;
};

const MAX_OBJECTIVES = 3;
const NUMERIC_KEYBOARD = 'numeric' as const;

export function RoutinePlannerMetaFields(props: Props): React.JSX.Element {
  return (
    <View style={s.card}>
      <Text style={s.label}>{props.t('coach.routine.objectives')}</Text>
      <View style={s.objectiveChipsWrap}>{renderObjectiveChips(props)}</View>
      <Text style={s.label}>{props.t('coach.routine.expectedDays')}</Text>
      <TextInput
        editable={!props.isReadOnly}
        keyboardType={NUMERIC_KEYBOARD}
        onChangeText={(value) => updateExpectedDays(props.setDraft, value)}
        placeholder={props.t('coach.routine.expectedDaysPlaceholder')}
        style={[s.input, props.isReadOnly && s.inputReadOnly]}
        value={toTextNumber(props.draft.expectedCompletionDays)}
      />
    </View>
  );
}

function renderObjectiveChips(props: Props): React.ReactNode {
  if (props.objectiveOptions.length === 0) {
    return <Text style={s.emptyDay}>{props.t('coach.routine.objectives.empty')}</Text>;
  }
  const selected = props.draft.objectiveIds ?? [];
  return props.objectiveOptions.map((option) => {
    const isSelected = selected.includes(option.id);
    const canSelect = isSelected || selected.length < MAX_OBJECTIVES;
    return (
      <Pressable
        disabled={props.isReadOnly || !canSelect}
        key={option.id}
        onPress={() => toggleObjective(props.setDraft, option.id)}
        style={[
          s.objectiveChip,
          isSelected && s.objectiveChipSelected,
          (props.isReadOnly || !canSelect) && s.objectiveChipDisabled,
        ]}
      >
        <Text style={[s.objectiveChipText, isSelected && s.objectiveChipTextSelected]}>
          {option.label}
        </Text>
      </Pressable>
    );
  });
}

function toggleObjective(
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>,
  objectiveId: string,
): void {
  setDraft((previous) => {
    const selected = previous.objectiveIds ?? [];
    const alreadySelected = selected.includes(objectiveId);
    if (alreadySelected) {
      return {
        ...previous,
        objectiveIds: selected.filter((id) => id !== objectiveId),
      };
    }
    if (selected.length >= MAX_OBJECTIVES) {
      return previous;
    }
    return {
      ...previous,
      objectiveIds: [...selected, objectiveId],
    };
  });
}

function updateExpectedDays(
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>,
  value: string,
): void {
  const trimmed = value.trim();
  if (!trimmed) {
    setDraft((previous) => ({ ...previous, expectedCompletionDays: null }));
    return;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 365) {
    return;
  }
  setDraft((previous) => ({ ...previous, expectedCompletionDays: parsed }));
}

function toTextNumber(value: null | number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${value}` : '';
}
