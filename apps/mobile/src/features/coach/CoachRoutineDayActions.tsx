import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { moveCoachItem } from '@trainerpro/shared';
import { CoachButton, ui } from './CoachUi';
import { freshRoutineDay, duplicateRoutineDay, type PlanRecord } from './coach-plan-model';
export function CoachRoutineDayActions({
  value,
  days,
  dayIndex,
  setDayIndex,
  update,
}: {
  value: PlanRecord;
  days: PlanRecord[];
  dayIndex: number;
  setDayIndex: (index: number) => void;
  update: (value: PlanRecord) => void;
}) {
  const { t } = useTranslation();
  const day = days[dayIndex];
  return (
    <View style={ui.row}>
      <CoachButton
        label={t('coachWorkspace.addDay')}
        disabled={days.length >= 14}
        onPress={() => {
          update({
            ...value,
            days: [...days, freshRoutineDay(t('coachWorkspace.routineDay') + ' ' + (days.length + 1))],
          });
          setDayIndex(days.length);
        }}
      />
      {day ? (
        <CoachButton
          label={t('coachWorkspace.duplicateDay')}
          disabled={days.length >= 14}
          onPress={() => update({ ...value, days: [...days, duplicateRoutineDay(day)] })}
        />
      ) : null}
      <CoachButton
        label={t('coachWorkspace.up')}
        disabled={dayIndex === 0}
        onPress={() => {
          update({ ...value, days: moveCoachItem(days, dayIndex, dayIndex - 1) });
          setDayIndex(dayIndex - 1);
        }}
      />
      <CoachButton
        label={t('coachWorkspace.down')}
        disabled={dayIndex >= days.length - 1}
        onPress={() => {
          update({ ...value, days: moveCoachItem(days, dayIndex, dayIndex + 1) });
          setDayIndex(dayIndex + 1);
        }}
      />
      <CoachButton
        label={t('coachWorkspace.deleteDay')}
        disabled={days.length <= 1}
        onPress={() => {
          update({ ...value, days: days.filter((_, i) => i !== dayIndex) });
          setDayIndex(0);
        }}
        danger
      />
    </View>
  );
}
