import { formatFoodAmount } from '@trainerpro/shared';
import { colors } from '@trainerpro/ui';
import {
  useNutritionAdherenceQuery,
  type NutritionAdherenceDay,
  type NutritionAdherenceMeal,
} from '../../../data/hooks/useNutrition';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import { styles } from './nutrition.styles';

type Translate = (key: string, options?: Record<string, number | string>) => string;
const STATUS_COLOR = { CHANGED: colors.warning, DONE: colors.success, SKIPPED: colors.danger } as const;

export function ClientNutritionAdherence({ clientId, t }: { clientId: string; t: Translate }): React.JSX.Element {
  const { i18n } = useTranslation();
  const week = range(7);
  const month = range(30);
  const weekQuery = useNutritionAdherenceQuery(clientId, week.from, week.to);
  const monthQuery = useNutritionAdherenceQuery(clientId, month.from, month.to);
  const days = (weekQuery.data?.days ?? []).filter((day) => day.expected > 0);
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{t('coach.nutrition.client.adherenceTitle')}</Text>
      <Text style={styles.headerSubtitle}>{t('coach.nutrition.client.adherence7', summary(weekQuery.data?.summary))}</Text>
      <Text style={styles.headerSubtitle}>{t('coach.nutrition.client.adherence30', summary(monthQuery.data?.summary))}</Text>
      {days.map((day) => (
        <AdherenceDay key={day.date} day={day} locale={i18n.language || 'es'} t={t} />
      ))}
    </View>
  );
}

function AdherenceDay(props: { day: NutritionAdherenceDay; locale: string; t: Translate }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const met = props.day.done + props.day.changed;
  const label = props.t('coach.nutrition.client.adherenceDay', {
    date: formatDayLabel(props.day.date, props.locale),
    done: met,
    expected: props.day.expected,
  });
  return (
    <View>
      <Pressable accessibilityLabel={label} onPress={() => setOpen((current) => !current)}>
        <Text style={[styles.headerSubtitle, { color: dayColor(met, props.day.expected) }]}>{label}</Text>
      </Pressable>
      {open ? <AdherenceMeals meals={props.day.meals} t={props.t} /> : null}
    </View>
  );
}

function AdherenceMeals(props: { meals: NutritionAdherenceMeal[]; t: Translate }): React.JSX.Element {
  if (props.meals.length === 0) return <Text style={styles.headerSubtitle}>{props.t('coach.nutrition.client.noLogs')}</Text>;
  return (
    <View>
      {props.meals.map((meal) => (
        <MealLogLine key={meal.mealKey} meal={meal} t={props.t} />
      ))}
    </View>
  );
}

function MealLogLine(props: { meal: NutritionAdherenceMeal; t: Translate }): React.JSX.Element {
  return (
    <View style={styles.logLine}>
      <Text style={[styles.headerSubtitle, { color: STATUS_COLOR[props.meal.status] }]}>
        {props.t('coach.nutrition.client.mealStatus', {
          name: props.meal.mealName,
          status: props.t(`coach.nutrition.client.status${statusKey(props.meal.status)}`),
        })}
      </Text>
      {props.meal.comment ? <Text style={styles.headerSubtitle}>{props.meal.comment}</Text> : null}
      {props.meal.eatenItems.map((item) => (
        <Text key={item.foodId} style={styles.headerSubtitle}>
          {props.t('coach.nutrition.client.eatenItem', {
            amount: formatFoodAmount(item.amount, item.servingUnit, props.t),
            name: item.name,
          })}
        </Text>
      ))}
      {props.meal.aiEstimate ? (
        <Text style={styles.headerSubtitle}>{props.t('coach.nutrition.client.estimateApprox', props.meal.aiEstimate)}</Text>
      ) : null}
      {props.meal.photoUrl ? <Image source={{ uri: props.meal.photoUrl }} style={styles.logPhoto} /> : null}
    </View>
  );
}

function statusKey(status: NutritionAdherenceMeal['status']): 'Changed' | 'Done' | 'Skipped' {
  if (status === 'CHANGED') return 'Changed';
  if (status === 'SKIPPED') return 'Skipped';
  return 'Done';
}

function dayColor(met: number, expected: number): string {
  if (expected > 0 && met >= expected) return colors.success;
  if (met > 0) return colors.warning;
  return colors.textMuted;
}

function range(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  return { from: key(from), to: key(to) };
}

function key(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function summary(data: { changed?: number; done: number; expected: number; percent: number | null } | undefined) {
  return { done: (data?.done ?? 0) + (data?.changed ?? 0), expected: data?.expected ?? 0, percent: data?.percent ?? 0 };
}

function formatDayLabel(date: string, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', weekday: 'short' }).formatToParts(
    new Date(`${date}T12:00:00`),
  );
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${pick('weekday')} ${pick('day')} ${pick('month')}`.replaceAll('.', '');
}
