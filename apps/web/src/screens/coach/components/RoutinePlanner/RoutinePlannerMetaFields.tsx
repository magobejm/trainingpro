import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { DraftState } from '../../RoutinePlanner.types';

type ObjectiveOption = { id: string; label: string };
type T = (key: string, options?: Record<string, unknown>) => string;

type Props = {
  draft: DraftState;
  isReadOnly: boolean;
  objectiveOptions: ObjectiveOption[];
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  t: T;
};

const MAX_OBJECTIVES = 3;
const DURATION_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);
const ICON_RADIO = '◉';
const ICON_REMOVE = '×';
const ICON_CALENDAR = '📅';
const ICON_CYCLE = '↺';

export function RoutinePlannerMetaFields(props: Props): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const selected = props.draft.objectiveIds ?? [];
  const microcycleDays = props.draft.expectedCompletionDays ?? null;
  return (
    <>
      {renderObjectivesCard(props, isOpen, setIsOpen, selected)}
      {renderDurationCard(props, microcycleDays, isDurationOpen, setIsDurationOpen)}
    </>
  );
}

function renderObjectivesCard(
  props: Props,
  isOpen: boolean,
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
  selected: string[],
): React.JSX.Element {
  return (
    <View style={s.card}>
      <View style={s.objectiveSectionHeader}>
        <Text style={s.objectiveSectionTitle}>{props.t('coach.routine.objectives')}</Text>
        <Text style={s.objectiveSectionSubtitle}>{props.t('coach.routine.objectives.subtitle')}</Text>
      </View>
      <Text style={s.objectiveSelectLabel}>{props.t('coach.routine.objectives.selectLabel')}</Text>
      {props.objectiveOptions.length === 0 ? (
        <Text style={s.emptyDay}>{props.t('coach.routine.objectives.empty')}</Text>
      ) : (
        <>
          {!props.isReadOnly && (
            <Pressable onPress={() => setIsOpen((v) => !v)} style={s.objectiveDropdownTrigger}>
              <Text style={s.objectiveDropdownIcon}>{ICON_RADIO}</Text>
              <Text style={s.objectiveDropdownPlaceholder}>{props.t('coach.routine.objectives.placeholder')}</Text>
              <Text style={s.objectiveDropdownChevron}>{isOpen ? '▲' : '▼'}</Text>
            </Pressable>
          )}
          {isOpen && !props.isReadOnly && (
            <View style={s.objectiveDropdownList}>
              {props.objectiveOptions.map((option) => {
                const isSelected = selected.includes(option.id);
                const canSelect = isSelected || selected.length < MAX_OBJECTIVES;
                return (
                  <Pressable
                    disabled={!canSelect}
                    key={option.id}
                    onPress={() => {
                      toggleObjective(props.setDraft, option.id);
                      setIsOpen(false);
                    }}
                    style={[s.objectiveDropdownItem, !canSelect && s.objectiveChipDisabled]}
                  >
                    <View style={[s.objectiveDropdownDot, isSelected && s.objectiveDropdownDotSelected]} />
                    <Text style={[s.objectiveDropdownItemText, isSelected && s.objectiveDropdownItemTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {selected.length > 0 && (
            <View style={s.objectiveChipsWrap}>
              {selected.map((id) => {
                const option = props.objectiveOptions.find((o) => o.id === id);
                if (!option) return null;
                return (
                  <View key={id} style={s.objectiveSelectedChip}>
                    <Text style={s.objectiveSelectedChipText}>{option.label}</Text>
                    {!props.isReadOnly && (
                      <Pressable onPress={() => toggleObjective(props.setDraft, id)}>
                        <Text style={s.objectiveSelectedChipRemove}>{ICON_REMOVE}</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
              {!props.isReadOnly && selected.length < MAX_OBJECTIVES && (
                <Pressable onPress={() => setIsOpen(true)} style={s.objectiveAddMore}>
                  <Text style={s.objectiveAddMoreText}>{props.t('coach.routine.objectives.addMore')}</Text>
                </Pressable>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function renderDurationCard(
  props: Props,
  microcycleDays: null | number,
  isDurationOpen: boolean,
  setIsDurationOpen: React.Dispatch<React.SetStateAction<boolean>>,
): React.JSX.Element {
  const daysLabel = (n: number) => `${n} ${props.t(n === 1 ? 'coach.routine.duration.day' : 'coach.routine.duration.days')}`;
  return (
    <View style={s.card}>
      <View style={s.durationCardHeader}>
        <Text style={s.durationCardHeaderIcon}>{ICON_CALENDAR}</Text>
        <Text style={s.durationCardHeaderTitle}>{props.t('coach.routine.duration.title')}</Text>
      </View>
      <View style={s.durationSeparator} />
      <View style={s.durationFieldWrap}>
        <Text style={s.durationFieldLabel}>{props.t('coach.routine.duration.microcycle.label')}</Text>
        <Pressable
          disabled={props.isReadOnly}
          onPress={() => setIsDurationOpen((v) => !v)}
          style={[s.durationDropdownTrigger, props.isReadOnly && s.inputReadOnly]}
        >
          <Text style={s.durationDropdownIcon}>{ICON_CYCLE}</Text>
          <Text style={microcycleDays ? s.durationDropdownValue : s.durationDropdownPlaceholder}>
            {microcycleDays ? daysLabel(microcycleDays) : props.t('coach.routine.duration.microcycle.placeholder')}
          </Text>
          {!props.isReadOnly && <Text style={s.durationDropdownChevron}>{isDurationOpen ? '▲' : '▽'}</Text>}
        </Pressable>
        {isDurationOpen && !props.isReadOnly && (
          <ScrollView bounces={false} style={s.durationDropdownList}>
            {DURATION_OPTIONS.map((days) => (
              <Pressable
                key={days}
                onPress={() => {
                  props.setDraft((prev) => ({ ...prev, expectedCompletionDays: days }));
                  setIsDurationOpen(false);
                }}
                style={[s.durationDropdownItem, microcycleDays === days && s.durationDropdownItemSelected]}
              >
                <Text style={[s.durationDropdownItemText, microcycleDays === days && s.durationDropdownItemTextSelected]}>
                  {daysLabel(days)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Text style={s.durationFieldHint}>{props.t('coach.routine.duration.microcycle.hint')}</Text>
      </View>
    </View>
  );
}

function toggleObjective(setDraft: React.Dispatch<React.SetStateAction<DraftState>>, objectiveId: string): void {
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
