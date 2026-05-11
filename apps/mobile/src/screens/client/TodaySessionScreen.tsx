import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import '../../i18n';

const COLORS = {
  action: '#ec4899',
  bg: '#07000f',
  muted: 'rgba(196,181,253,0.7)',
  text: '#ffffff',
  white: '#ffffff',
};
import {
  useFinishSessionMutation,
  useLogSetMutation,
  useSessionQuery,
  useStartSessionMutation,
} from '../../data/hooks/useTodaySession';
import { RestTimer } from '../../features/timers/RestTimer';
import { ExerciseCarousel } from './ExerciseCarousel';
import { FinishSessionModal } from './FinishSessionModal';
import { WeeklyReportScreen } from './WeeklyReportScreen';

const REPORT_MODAL_ANIMATION = 'slide' as const;

type TodaySessionScreenProps = {
  onClose: () => void;
  sessionId: string;
};

export function TodaySessionScreen(props: TodaySessionScreenProps): React.JSX.Element {
  const [finishOpen, setFinishOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const handlers = useTodaySessionHandlers(props.sessionId, setFinishOpen, setReportOpen);
  return (
    <TodaySessionContent
      finishOpen={finishOpen}
      handlers={handlers}
      onClose={props.onClose}
      reportOpen={reportOpen}
      sessionId={props.sessionId}
    />
  );
}

type TodaySessionContentProps = {
  finishOpen: boolean;
  handlers: ReturnType<typeof useTodaySessionHandlers>;
  onClose: () => void;
  reportOpen: boolean;
  sessionId: string;
};

function TodaySessionContent(props: TodaySessionContentProps): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <TodaySessionHeader />
      <Pressable onPress={props.handlers.onStart} style={styles.button}>
        <StartButtonLabel />
      </Pressable>
      <ExerciseCarousel items={props.handlers.data.sessionQuery.data?.items ?? []} onLogSet={props.handlers.onLogSet} />
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
        <WeeklyReportScreen onClose={props.onClose} sourceSessionId={props.sessionId} />
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

function useTodaySessionData(sessionId: string) {
  const sessionQuery = useSessionQuery(sessionId);
  const startMutation = useStartSessionMutation(sessionId);
  const finishMutation = useFinishSessionMutation(sessionId);
  const logSetMutation = useLogSetMutation(sessionId);
  return { sessionQuery, startMutation, finishMutation, logSetMutation };
}

// eslint-disable-next-line max-lines-per-function
function useTodaySessionHandlers(
  sessionId: string,
  setFinishOpen: (value: boolean) => void,
  setReportOpen: (value: boolean) => void,
) {
  const data = useTodaySessionData(sessionId);

  const onLogSet = (
    sessionItemId: string,
    setIndex: number,
    repsDone: number | null,
    effortRpe: number | null,
    weightDoneKg: number | null,
  ) => {
    data.logSetMutation.mutate({
      effortRpe,
      repsDone,
      sessionItemId,
      setIndex,
      weightDoneKg,
    });
  };

  return {
    data,
    onCloseFinish: () => setFinishOpen(false),
    onCloseWeeklyReport: () => setReportOpen(false),
    onFinish: () => {
      data.finishMutation.mutate();
      setFinishOpen(false);
    },
    onLogSet,
    onOpenFinish: () => setFinishOpen(true),
    onOpenWeeklyReport: () => setReportOpen(true),
    onStart: () => data.startMutation.mutate(),
  };
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
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
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
