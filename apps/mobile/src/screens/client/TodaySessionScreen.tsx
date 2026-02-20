import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import {
  useFinishSessionMutation,
  useLogSetMutation,
  useSessionQuery,
  useStartSessionMutation,
} from '../../data/hooks/useTodaySession';
import { RestTimer } from '../../features/timers/RestTimer';
import { FinishSessionModal } from './FinishSessionModal';
import { WeeklyReportScreen } from './WeeklyReportScreen';

const COLORS = {
  action: '#225fdb',
  bg: '#edf3fb',
  card: '#ffffff',
  muted: '#627285',
  text: '#0e1a2f',
  white: '#ffffff',
};

const DEMO_SESSION_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const REPORT_MODAL_ANIMATION = 'slide' as const;

export function TodaySessionScreen(): React.JSX.Element {
  const [finishOpen, setFinishOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const handlers = useTodaySessionHandlers(DEMO_SESSION_ID, setFinishOpen, setReportOpen);
  return (
    <TodaySessionContent
      finishOpen={finishOpen}
      handlers={handlers}
      reportOpen={reportOpen}
    />
  );
}

type TodaySessionContentProps = {
  finishOpen: boolean;
  handlers: ReturnType<typeof useTodaySessionHandlers>;
  reportOpen: boolean;
};

function TodaySessionContent(props: TodaySessionContentProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <TodaySessionHeader />
      <Pressable onPress={props.handlers.onStart} style={styles.button}>
        <StartButtonLabel />
      </Pressable>
      <SessionItemsCard
        items={props.handlers.data.sessionQuery.data?.items ?? []}
        onLogSet={props.handlers.onLogSet}
      />
      <RestTimerBlock />
      <Pressable onPress={props.handlers.onOpenFinish} style={styles.button}>
        <FinishButtonLabel />
      </Pressable>
      <FinishSessionModal
        onClose={props.handlers.onCloseFinish}
        onOpenWeeklyReport={props.handlers.onOpenWeeklyReport}
        onSubmit={props.handlers.onFinish}
        visible={props.finishOpen}
      />
      <Modal animationType={REPORT_MODAL_ANIMATION} transparent visible={props.reportOpen}>
        <WeeklyReportScreen
          onClose={props.handlers.onCloseWeeklyReport}
          sourceSessionId={DEMO_SESSION_ID}
        />
      </Modal>
    </ScrollView>
  );
}

function TodaySessionHeader(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.title}>{t('client.today.title')}</Text>
      <Text style={styles.subtitle}>{t('client.today.subtitle')}</Text>
    </>
  );
}

function StartButtonLabel(): React.JSX.Element {
  const { t } = useTranslation();
  return <Text style={styles.buttonLabel}>{t('client.today.start')}</Text>;
}

function FinishButtonLabel(): React.JSX.Element {
  const { t } = useTranslation();
  return <Text style={styles.buttonLabel}>{t('client.today.finish')}</Text>;
}

type SessionItem = { id: string; displayName: string; setsPlanned: null | number };

type SessionItemsCardProps = {
  items: SessionItem[];
  onLogSet: (sessionItemId: string) => void;
};

function SessionItemsCard(props: SessionItemsCardProps): React.JSX.Element {
  const { t } = useTranslation();
  return <View style={styles.card}>{renderItems(props.items, t, props.onLogSet)}</View>;
}

function renderItems(
  items: { id: string; displayName: string; setsPlanned: null | number }[],
  t: (key: string) => string,
  onLogSet: (sessionItemId: string) => void,
) {
  if (items.length === 0) {
    return <Text style={styles.empty}>{t('client.today.empty')}</Text>;
  }
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.itemTitle}>{item.displayName}</Text>
          <Text style={styles.itemMeta}>{`${t('client.today.sets')}: ${item.setsPlanned ?? 0}`}</Text>
          <Pressable onPress={() => onLogSet(item.id)} style={styles.ghost}>
            <Text style={styles.ghostLabel}>{t('client.today.logSet')}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function useTodaySessionData(sessionId: string) {
  const sessionQuery = useSessionQuery(sessionId);
  const startMutation = useStartSessionMutation(sessionId);
  const finishMutation = useFinishSessionMutation(sessionId);
  const logSetMutation = useLogSetMutation(sessionId);
  return { sessionQuery, startMutation, finishMutation, logSetMutation };
}

function useTodaySessionHandlers(
  sessionId: string,
  setFinishOpen: (value: boolean) => void,
  setReportOpen: (value: boolean) => void,
) {
  const data = useTodaySessionData(sessionId);
  return {
    data,
    onStart: () => data.startMutation.mutate(),
    onOpenFinish: () => setFinishOpen(true),
    onCloseFinish: () => setFinishOpen(false),
    onOpenWeeklyReport: () => setReportOpen(true),
    onCloseWeeklyReport: () => setReportOpen(false),
    onFinish: () => {
      data.finishMutation.mutate();
      setFinishOpen(false);
    },
    onLogSet: (sessionItemId: string) =>
      data.logSetMutation.mutate(buildLogSetInput(sessionItemId)),
  };
}

function buildLogSetInput(sessionItemId: string) {
  return { repsDone: 10, sessionItemId, setIndex: 1 };
}

function RestTimerBlock(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <RestTimer
      initialSeconds={90}
      label={t('client.today.restTimer')}
      pauseLabel={t('client.today.pause')}
      resetLabel={t('client.today.reset')}
      startLabel={t('client.today.startTimer')}
    />
  );
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
    width: 120,
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
