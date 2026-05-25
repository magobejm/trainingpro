import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { useClientRoutineQuery, type ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { OverlayBackHeader } from '../../shell/client/client-shell.primitives';
import { PlanDayCard } from './ClientPlanningDayCard';
import { PlanHero } from './ClientPlanningHero';
import { TypeDistribution } from './ClientPlanningTypeDistribution';
import { WeekDistributionGrid } from './ClientPlanningWeekGrid';
import { aggregateMicrocycleTypes, buildWeekSlots } from './client-planning.helpers';

const SPINNER_COLOR = '#ec4899';

type Props = {
  onClose: () => void;
  onSelectDay: (day: ClientRoutineDay) => void;
};

export function ClientPlanningScreen({ onClose, onSelectDay }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const { data: routine, isLoading } = useClientRoutineQuery();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <OverlayBackHeader onClose={onClose} title={t('client.planning.title')} />
        <View style={styles.centered}>
          <ActivityIndicator color={SPINNER_COLOR} />
        </View>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.container}>
        <OverlayBackHeader onClose={onClose} title={t('client.planning.title')} />
        <View style={styles.centered}>
          <Text style={styles.empty}>{t('client.planning.empty')}</Text>
        </View>
      </View>
    );
  }

  return <PlanningContent onClose={onClose} onSelectDay={onSelectDay} routine={routine} />;
}

type ContentProps = Props & { routine: NonNullable<ReturnType<typeof useClientRoutineQuery>['data']> };

function PlanningContent({ onClose, onSelectDay, routine }: ContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const cycleLength = routine.expectedCompletionDays ?? 7;
  const slots = useMemo(() => buildWeekSlots(routine.planDays, cycleLength), [routine.planDays, cycleLength]);
  const typeCounts = useMemo(() => aggregateMicrocycleTypes(routine.planDays), [routine.planDays]);
  const total = typeCounts.reduce((sum, tc) => sum + tc.count, 0);

  return (
    <View style={styles.container}>
      <OverlayBackHeader onClose={onClose} title={t('client.planning.title')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PlanHero routine={routine} />
        <WeekDistributionGrid onSelectDay={onSelectDay} slots={slots} />
        <TypeDistribution counts={typeCounts} total={total} />
        <View style={styles.daysSection}>
          <Text style={styles.daysTitle}>{t('client.planning.trainingDaysSection')}</Text>
          {routine.planDays.map((day) => (
            <PlanDayCard key={day.id} day={day} onPress={() => onSelectDay(day)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { backgroundColor: '#07000f', flex: 1 },
  content: { paddingBottom: 32 },
  daysSection: { marginHorizontal: 12, marginTop: 16 },
  daysTitle: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  empty: { color: 'rgba(196,181,253,0.7)' },
});
