import React, { useCallback, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { ClientCalendarScreen } from '../../screens/client/ClientCalendarScreen';
import { ClientLibraryScreen } from '../../screens/client/ClientLibraryScreen';
import { ClientMeasuresScreen } from '../../screens/client/ClientMeasuresScreen';
import { ClientMoodScreen } from '../../screens/client/ClientMoodScreen';
import { ClientPlanningScreen } from '../../screens/client/ClientPlanningScreen';
import { ChatScreen } from '../../screens/shared/ChatScreen';
import { IncidentsScreen } from '../../screens/client/IncidentsScreen';
import { ProgressScreen } from '../../screens/client/ProgressScreen';
import { TodaySessionScreen } from '../../screens/client/TodaySessionScreen';
import { RoutineScreen } from '../../screens/client/RoutineScreen';
import { RoutineDayPreviewPanel } from './RoutineDayPreviewPanel';
import { BottomNav, type TabId } from '../../theme/primitives';
import { SPRING, type MoreMenuId, type OverlayId, type ProgressMode } from './client-shell.constants';
import { s } from './client-shell.styles';
import { HomeHub } from './ClientShellHome';
import { ProfilePanel } from './ClientShellPanels';
import { MoreScreen } from './MoreScreen';

type ShellState = {
  activeTab: TabId;
  activeSessionId: string | null;
  overlay: OverlayId;
  progressMode: ProgressMode;
  selectedDay: ClientRoutineDay | null;
  slideX: Animated.Value;
  closeOverlay: () => void;
  openDay: (day: ClientRoutineDay) => void;
  openOverlay: (id: OverlayId) => void;
  openProgress: (mode: ProgressMode) => void;
  openSession: (sessionId: string) => void;
  setActiveTab: (tab: TabId) => void;
};

function useShellState(): ShellState {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [overlay, setOverlay] = useState<OverlayId>(null);
  const [selectedDay, setSelectedDay] = useState<ClientRoutineDay | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [progressMode, setProgressMode] = useState<ProgressMode>('progress');
  const slideX = useRef(new Animated.Value(600)).current;

  const openOverlay = useCallback(
    (id: OverlayId) => {
      setOverlay(id);
      Animated.spring(slideX, { toValue: 0, ...SPRING }).start();
    },
    [slideX],
  );

  const closeOverlay = useCallback(() => {
    Animated.spring(slideX, { toValue: 600, ...SPRING }).start(() => {
      setOverlay(null);
      setProgressMode('progress');
      if (overlay === 'routineDay') setSelectedDay(null);
      if (overlay === 'session') setActiveSessionId(null);
    });
  }, [overlay, slideX]);

  const openProgress = useCallback(
    (mode: ProgressMode) => {
      setProgressMode(mode);
      setOverlay('progress');
      Animated.spring(slideX, { toValue: 0, ...SPRING }).start();
    },
    [slideX],
  );

  const openDay = useCallback(
    (day: ClientRoutineDay) => {
      setSelectedDay(day);
      setOverlay('routineDay');
      Animated.spring(slideX, { toValue: 0, ...SPRING }).start();
    },
    [slideX],
  );

  const openSession = useCallback(
    (sessionId: string) => {
      setActiveSessionId(sessionId);
      setOverlay('session');
      Animated.spring(slideX, { toValue: 0, ...SPRING }).start();
    },
    [slideX],
  );

  return {
    activeSessionId,
    activeTab,
    closeOverlay,
    openDay,
    openOverlay,
    openProgress,
    openSession,
    overlay,
    progressMode,
    selectedDay,
    setActiveTab,
    slideX,
  };
}

function dispatchMoreMenu(
  id: MoreMenuId,
  openOverlay: (id: OverlayId) => void,
  openProgress: (mode: ProgressMode) => void,
): void {
  if (id === 'incidents') openOverlay('incidents');
  else if (id === 'measures') openOverlay('measures');
  else if (id === 'planning') openOverlay('planning');
  else if (id === 'volume') openProgress('volume');
}

export function ClientShell(): React.JSX.Element {
  const { t } = useTranslation();
  const st = useShellState();
  const showBottomNav = st.overlay === null;

  return (
    <View style={s.root}>
      {st.activeTab === 'home' && (
        <HomeHub
          onOpenMood={() => st.openOverlay('mood')}
          onOpenProfile={() => st.openOverlay('profile')}
          onOpenProgress={() => st.openProgress('progress')}
          onOpenRoutine={() => st.openOverlay('routine')}
        />
      )}
      {st.activeTab === 'chat' && <ChatScreen embedded />}
      {st.activeTab === 'more' && <MoreScreen onNavigate={(id) => dispatchMoreMenu(id, st.openOverlay, st.openProgress)} />}

      {showBottomNav ? (
        <BottomNav
          active={st.activeTab}
          labels={{
            chat: t('mobile.tab.chat'),
            home: t('mobile.client.home.tab'),
            more: t('mobile.client.more.tab'),
          }}
          onChange={st.setActiveTab}
        />
      ) : null}

      {st.overlay === 'profile' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <ProfilePanel onClose={st.closeOverlay} />
        </Animated.View>
      )}
      {st.overlay === 'routine' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <RoutineScreen onClose={st.closeOverlay} onSelectDay={st.openDay} />
        </Animated.View>
      )}
      {st.overlay === 'routineDay' && st.selectedDay !== null && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <RoutineDayPreviewPanel day={st.selectedDay} onClose={st.closeOverlay} onOpenSession={st.openSession} />
        </Animated.View>
      )}
      {st.overlay === 'session' && st.activeSessionId !== null && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <TodaySessionScreen onClose={st.closeOverlay} sessionId={st.activeSessionId} />
        </Animated.View>
      )}
      {st.overlay === 'progress' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <ProgressScreen mode={st.progressMode} onClose={st.closeOverlay} />
        </Animated.View>
      )}
      {st.overlay === 'measures' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <ClientMeasuresScreen onClose={st.closeOverlay} />
        </Animated.View>
      )}
      {st.overlay === 'mood' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <ClientMoodScreen onClose={st.closeOverlay} />
        </Animated.View>
      )}
      {st.overlay === 'incidents' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <IncidentsScreen onClose={st.closeOverlay} />
        </Animated.View>
      )}
      {st.overlay === 'calendar' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <ClientCalendarScreen onClose={st.closeOverlay} onOpenSession={st.openSession} />
        </Animated.View>
      )}
      {st.overlay === 'planning' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <ClientPlanningScreen onClose={st.closeOverlay} onSelectDay={st.openDay} />
        </Animated.View>
      )}
      {st.overlay === 'library' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <ClientLibraryScreen onClose={st.closeOverlay} />
        </Animated.View>
      )}
    </View>
  );
}
