import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import {
  useCardioSessionQuery,
  useFinishCardioSessionMutation,
  useLogIntervalMutation,
  useStartCardioSessionMutation,
} from '../../data/hooks/useCardioSession';
import { IntervalTimer } from '../../features/timers/IntervalTimer';

const COLORS = {
  action: '#225fdb',
  bg: '#edf3fb',
  card: '#ffffff',
  muted: '#627285',
  text: '#0e1a2f',
  white: '#ffffff',
};

const DEMO_SESSION_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

export function CardioSessionScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const sessionQuery = useCardioSessionQuery(DEMO_SESSION_ID);
  const startMutation = useStartCardioSessionMutation(DEMO_SESSION_ID);
  const finishMutation = useFinishCardioSessionMutation(DEMO_SESSION_ID);
  const logIntervalMutation = useLogIntervalMutation(DEMO_SESSION_ID);
  const blocks = sessionQuery.data?.blocks ?? [];
  const firstBlock = blocks[0];
  const timerSeconds = useMemo(() => firstBlock?.workSeconds ?? 30, [firstBlock]);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{t('client.cardio.title')}</Text>
      <Text style={styles.subtitle}>{t('client.cardio.subtitle')}</Text>
      <Pressable onPress={() => startMutation.mutate()} style={styles.button}>
        <Text style={styles.buttonLabel}>{t('client.cardio.start')}</Text>
      </Pressable>
      <View style={styles.card}>{renderBlocks(blocks, t, logIntervalMutation.mutate)}</View>
      <IntervalTimer
        pauseLabel={t('client.cardio.pause')}
        resetLabel={t('client.cardio.reset')}
        runningLabel={t('client.cardio.running')}
        seconds={timerSeconds}
        startLabel={t('client.cardio.startTimer')}
      />
      <Pressable onPress={() => finishMutation.mutate()} style={styles.button}>
        <Text style={styles.buttonLabel}>{t('client.cardio.finish')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function renderBlocks(
  blocks: {
    displayName: string;
    id: string;
    roundsPlanned: number;
    targetDistanceMeters: null | number;
    targetRpe: null | number;
    workSeconds: number;
  }[],
  t: (key: string) => string,
  onLogInterval: (input: {
    distanceDoneMeters: null | number;
    durationSecondsDone: number;
    effortRpe: null | number;
    intervalIndex: number;
    sessionCardioBlockId: string;
  }) => void,
) {
  if (blocks.length === 0) {
    return <Text style={styles.empty}>{t('client.cardio.empty')}</Text>;
  }
  return (
    <View style={styles.list}>
      {blocks.map((block) => renderBlockItem(block, t, onLogInterval))}
    </View>
  );
}

function renderBlockItem(
  block: {
    displayName: string;
    id: string;
    roundsPlanned: number;
    targetDistanceMeters: null | number;
    targetRpe: null | number;
    workSeconds: number;
  },
  t: (key: string) => string,
  onLogInterval: (input: {
    distanceDoneMeters: null | number;
    durationSecondsDone: number;
    effortRpe: null | number;
    intervalIndex: number;
    sessionCardioBlockId: string;
  }) => void,
) {
  return (
    <View key={block.id} style={styles.item}>
      <Text style={styles.itemTitle}>{block.displayName}</Text>
      <Text style={styles.itemMeta}>{`${t('client.cardio.rounds')}: ${block.roundsPlanned}`}</Text>
      <Text style={styles.itemMeta}>{`${t('client.cardio.work')}: ${block.workSeconds}s`}</Text>
      <Pressable onPress={() => onLogInterval(buildLogIntervalInput(block))} style={styles.ghost}>
        <Text style={styles.ghostLabel}>{t('client.cardio.logInterval')}</Text>
      </Pressable>
    </View>
  );
}

function buildLogIntervalInput(block: {
  id: string;
  targetDistanceMeters: null | number;
  targetRpe: null | number;
  workSeconds: number;
}) {
  return {
    distanceDoneMeters: block.targetDistanceMeters,
    durationSecondsDone: block.workSeconds,
    effortRpe: block.targetRpe,
    intervalIndex: 1,
    sessionCardioBlockId: block.id,
  };
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
    width: '100%',
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 10,
    padding: 14,
    width: '100%',
  },
  empty: {
    color: COLORS.muted,
    fontSize: 14,
  },
  ghost: {
    alignItems: 'center',
    borderColor: '#d8e1ee',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    width: 150,
  },
  ghostLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  item: {
    borderColor: '#dce5f2',
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  itemMeta: {
    color: COLORS.muted,
    fontSize: 12,
  },
  itemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    gap: 8,
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 10,
    minHeight: '100%',
    padding: 16,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    width: '100%',
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    width: '100%',
  },
});
