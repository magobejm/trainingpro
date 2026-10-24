import { formatFoodAmount } from '@trainerpro/shared';
import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LIGHT } from '../../theme/light';

type Translate = (key: string, options?: Record<string, number | string>) => string;
type EatenItem = { amount: number; foodId: string; name: string; servingUnit: string | null };
type MealLog = {
  comment: string | null;
  eatenItems: EatenItem[];
  mealKey: string;
  mealName: string;
  photoUrl: string | null;
  status: 'CHANGED' | 'DONE' | 'SKIPPED';
};
export type NutritionAdherenceDay = {
  changed: number;
  date: string;
  done: number;
  expected: number;
  meals: MealLog[];
};

const STATUS_COLOR = { CHANGED: LIGHT.orange, DONE: LIGHT.success, SKIPPED: LIGHT.red } as const;

export function CoachClientNutritionDays(props: {
  days: NutritionAdherenceDay[];
  locale: string;
  t: Translate;
}): React.JSX.Element {
  const visible = props.days.filter((day) => day.expected > 0);
  return (
    <View>
      {visible.map((day) => (
        <NutritionDay key={day.date} day={day} locale={props.locale} t={props.t} />
      ))}
    </View>
  );
}

function NutritionDay(props: { day: NutritionAdherenceDay; locale: string; t: Translate }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const met = props.day.done + props.day.changed;
  const label = props.t('coach.nutrition.adherenceDay', {
    date: formatDayLabel(props.day.date, props.locale),
    done: met,
    expected: props.day.expected,
  });
  return (
    <View>
      <Pressable accessibilityLabel={label} onPress={() => setOpen((current) => !current)}>
        <Text style={{ color: dayColor(met, props.day.expected) }}>{label}</Text>
      </Pressable>
      {open ? <DayMeals meals={props.day.meals} t={props.t} /> : null}
    </View>
  );
}

function DayMeals(props: { meals: MealLog[]; t: Translate }): React.JSX.Element {
  if (props.meals.length === 0) return <Text style={{ color: LIGHT.textMuted }}>{props.t('coach.nutrition.noLogs')}</Text>;
  return (
    <View>
      {props.meals.map((meal) => (
        <MealLine key={meal.mealKey} meal={meal} t={props.t} />
      ))}
    </View>
  );
}

function MealLine(props: { meal: MealLog; t: Translate }): React.JSX.Element {
  return (
    <View>
      <Text style={{ color: STATUS_COLOR[props.meal.status] }}>
        {props.t('coach.nutrition.mealStatus', {
          name: props.meal.mealName,
          status: props.t(`coach.nutrition.status${statusName(props.meal.status)}`),
        })}
      </Text>
      {props.meal.comment ? <Text style={{ color: LIGHT.text }}>{props.meal.comment}</Text> : null}
      {props.meal.eatenItems.map((item) => (
        <Text key={item.foodId} style={{ color: LIGHT.textMuted }}>
          {eatenLabel(item, props.t)}
        </Text>
      ))}
      {props.meal.photoUrl ? <Image source={{ uri: props.meal.photoUrl }} style={photo} /> : null}
    </View>
  );
}

function statusName(status: MealLog['status']): 'Changed' | 'Done' | 'Skipped' {
  if (status === 'CHANGED') return 'Changed';
  if (status === 'SKIPPED') return 'Skipped';
  return 'Done';
}

function eatenLabel(item: EatenItem, t: Translate): string {
  return t('coach.nutrition.eatenItem', { amount: formatFoodAmount(item.amount, item.servingUnit, t), name: item.name });
}

function dayColor(met: number, expected: number): string {
  if (expected > 0 && met >= expected) return LIGHT.success;
  if (met > 0) return LIGHT.orange;
  return LIGHT.textMuted;
}

function formatDayLabel(date: string, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', weekday: 'short' }).formatToParts(
    new Date(`${date}T12:00:00`),
  );
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${pick('weekday')} ${pick('day')} ${pick('month')}`.replaceAll('.', '');
}

const photo = { borderRadius: LIGHT.radiusSm, height: 64, marginTop: 4, width: 64 } as const;
