import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientRoutineNeat } from '../../data/hooks/useClientRoutineQuery';
import { useClientNeatLogs } from '../../data/hooks/useClientNeatLogs';
import { localDateKey } from '../../screens/client/daily-checkin.utils';
import { shouldShowClientNeatSection } from '../../screens/client/client-neat.utils';
import { LIGHT } from '../../theme/light';
import { stepsTarget } from '../../health/health-metrics';
import { useStepGoals } from '../../health/use-step-goals';

export function HomeNeatCard(props: { neats: ClientRoutineNeat[] | undefined }): React.JSX.Element | null {
  const { t } = useTranslation();
  const logs = useClientNeatLogs(localDateKey());
  const steps = useStepGoals(props.neats, logs.logs, logs.toggle);
  if (!shouldShowClientNeatSection(props.neats)) return null;
  return (
    <View style={{ gap: 8, paddingHorizontal: 16, paddingTop: 12 }}>
      <Text style={{ color: LIGHT.textStrong, fontWeight: '800' }}>{t('mobile.client.neat.today')}</Text>
      {props.neats?.map((neat) => {
        const done = logs.logs.some((log) => log.neatId === neat.id && log.done);
        return (
          <Pressable
            accessibilityRole={'checkbox'}
            accessibilityState={{ checked: done }}
            key={neat.id}
            onPress={() => logs.toggle(neat.id, !done)}
            style={{
              alignItems: 'center',
              backgroundColor: LIGHT.bgCard,
              borderRadius: LIGHT.radiusMd,
              flexDirection: 'row',
              gap: 8,
              padding: 12,
            }}
          >
            <Text style={{ color: LIGHT.accentDark, fontWeight: '800' }}>{done ? '✓' : '○'}</Text>
            <Text style={{ color: LIGHT.textStrong, flex: 1 }}>
              {stepsTarget(neat.title) != null && steps != null
                ? t('mobile.client.neat.stepsCount', { count: steps, title: neat.title })
                : neat.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
