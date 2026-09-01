import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useClientCalendarEventsQuery } from '../../data/hooks/useClientCalendar';
import { useClientMeQuery, resolveDisplayName } from '../../data/hooks/useClientMeQuery';
import { useClientRoutineQuery } from '../../data/hooks/useClientRoutineQuery';
import { getWeekDateRange, resolveRoutineWeekSchedule } from '../../screens/client/routine-schedule.utils';
import { ActionCard, IconUser } from '../../theme/primitives';
import { LIGHT } from '../../theme/light';
import { s } from './client-shell.styles';

type HomeHubProps = {
  onOpenMood: () => void;
  onOpenProfile: () => void;
  onOpenProgress: () => void;
  onOpenRoutine: () => void;
};

export function HomeHub(props: HomeHubProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: client } = useClientMeQuery();
  const { data: routine } = useClientRoutineQuery();
  const today = useMemo(() => new Date(), []);
  const weekRange = useMemo(() => getWeekDateRange(today), [today]);
  const calendarQuery = useClientCalendarEventsQuery(weekRange.from, weekRange.to);
  const schedule = useMemo(() => {
    if (!routine) return null;
    return resolveRoutineWeekSchedule(routine.planDays, calendarQuery.data?.data ?? [], today);
  }, [calendarQuery.data?.data, routine, today]);

  const dateLabel = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
  const focusLabel = useMemo(() => {
    if (!schedule) return '—';
    if (schedule.mode === 'assigned') {
      return schedule.days[0]?.title ?? '—';
    }
    if (schedule.today) return schedule.today.title;
    if (schedule.isRestDay) return t('mobile.client.routine.restDay');
    return '—';
  }, [schedule, t]);
  const routineSubtitle = focusLabel;

  return (
    <View style={s.homeScroll}>
      <View style={s.homeHeader}>
        <Pressable onPress={props.onOpenProfile} style={s.profileCard}>
          <View style={s.profileCardRow}>
            <View style={s.profileCardAvatar}>
              <IconUser size={20} color={LIGHT.accent} />
            </View>
            <View style={s.profileCardInfo}>
              <Text style={s.profileCardLabel}>{t('mobile.client.home.profile')}</Text>
              <Text style={s.profileCardName}>{resolveDisplayName(client)}</Text>
            </View>
          </View>
        </Pressable>
        <View style={s.todayCard}>
          <View style={s.todayCardHeader}>
            <View>
              <Text style={s.todayCardDate}>{dateLabel}</Text>
              <Text style={s.todayCardFocus}>{focusLabel}</Text>
            </View>
            <Text style={{ color: LIGHT.textOnNavyMuted, fontSize: 18 }}>{'📅'}</Text>
          </View>
        </View>
      </View>
      <View style={s.homeContent}>
        <ActionCard
          icon={<Text style={{ fontSize: 24 }}>{'🏋️'}</Text>}
          onPress={props.onOpenRoutine}
          subtitle={routineSubtitle}
          title={t('mobile.client.home.routine')}
        />
        <ActionCard
          disabled
          icon={<Text style={{ fontSize: 24 }}>{'🍽️'}</Text>}
          subtitle={t('mobile.client.home.nutritionComingSoon')}
          title={t('mobile.client.home.nutrition')}
        />
        <ActionCard
          icon={<Text style={{ fontSize: 24 }}>{'📈'}</Text>}
          onPress={props.onOpenProgress}
          subtitle={t('mobile.client.home.progressSubtitle')}
          title={t('mobile.client.home.progress')}
        />
        <ActionCard
          icon={<Text style={{ fontSize: 24 }}>{'😊'}</Text>}
          onPress={props.onOpenMood}
          subtitle={t('mobile.client.home.moodSubtitle')}
          title={t('mobile.client.home.mood')}
        />
      </View>
    </View>
  );
}
