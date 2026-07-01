import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useClientMeQuery, resolveDisplayName } from '../../data/hooks/useClientMeQuery';
import { useClientRoutineQuery } from '../../data/hooks/useClientRoutineQuery';
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
  const todayInfo = resolveTodayInfo(routine?.planDays ?? []);

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
              <Text style={s.todayCardDate}>{todayInfo.dateLabel}</Text>
              <Text style={s.todayCardFocus}>{todayInfo.focusLabel}</Text>
            </View>
            <Text style={{ color: LIGHT.textOnNavyMuted, fontSize: 18 }}>{'📅'}</Text>
          </View>
        </View>
      </View>
      <View style={s.homeContent}>
        <ActionCard
          icon={<Text style={{ fontSize: 24 }}>{'🏋️'}</Text>}
          onPress={props.onOpenRoutine}
          subtitle={todayInfo.routineSubtitle}
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

function resolveTodayInfo(planDays: { dayIndex: number; title: string }[]): {
  dateLabel: string;
  focusLabel: string;
  routineSubtitle: string;
} {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
  const dayIndex = now.getDay();
  const trainingDay = planDays.length > 0 ? planDays[dayIndex % planDays.length] : null;
  const focusLabel = trainingDay?.title ?? '—';
  const routineSubtitle = trainingDay ? trainingDay.title : '—';
  return { dateLabel, focusLabel, routineSubtitle };
}
