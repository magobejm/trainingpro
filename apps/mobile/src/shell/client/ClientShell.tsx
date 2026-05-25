import React, { useCallback, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
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
import { SPRING, WEB_BLUR_LG, type MenuId, type OverlayId, type ProgressMode } from './client-shell.constants';
import { showComingSoon } from './feedback';
import { s } from './client-shell.styles';
import { HomeHub } from './ClientShellHome';
import { DayDetailPanel, MenuConfigPanel, ProfilePanel, RoutinePanel } from './ClientShellPanels';
import { OverlayBackHeader } from './client-shell.primitives';

type ShellState = {
  activeMenuIds: string[];
  activeSessionId: string | null;
  overlay: OverlayId;
  progressMode: ProgressMode;
  selectedDay: ClientRoutineDay | null;
  slideX: Animated.Value;
  slideY: Animated.Value;
  closeOverlay: () => void;
  openDay: (day: ClientRoutineDay) => void;
  openOverlay: (id: OverlayId) => void;
  openProgress: (mode: ProgressMode) => void;
  openSession: (sessionId: string) => void;
  setActiveMenuIds: React.Dispatch<React.SetStateAction<string[]>>;
};

function useShellState(): ShellState {
  const [overlay, setOverlay] = useState<OverlayId>(null);
  const [selectedDay, setSelectedDay] = useState<ClientRoutineDay | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeMenuIds, setActiveMenuIds] = useState<string[]>(['measures', 'notes', 'chat', 'incidents']);
  const [progressMode, setProgressMode] = useState<ProgressMode>('progress');
  const slideX = useRef(new Animated.Value(600)).current;
  const slideY = useRef(new Animated.Value(900)).current;

  const openOverlay = useCallback(
    (id: OverlayId) => {
      setOverlay(id);
      if (id === 'menu') {
        Animated.spring(slideY, { toValue: 0, ...SPRING }).start();
      } else {
        Animated.spring(slideX, { toValue: 0, ...SPRING }).start();
      }
    },
    [slideX, slideY],
  );

  const closeOverlay = useCallback(() => {
    const ref = overlay === 'menu' ? slideY : slideX;
    Animated.spring(ref, { toValue: overlay === 'menu' ? 900 : 600, ...SPRING }).start(() => {
      setOverlay(null);
      setProgressMode('progress');
      if (overlay === 'routineDay') setSelectedDay(null);
      if (overlay === 'session') setActiveSessionId(null);
    });
  }, [overlay, slideX, slideY]);

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
    activeMenuIds,
    activeSessionId,
    closeOverlay,
    openDay,
    openOverlay,
    openProgress,
    openSession,
    overlay,
    progressMode,
    selectedDay,
    setActiveMenuIds,
    slideX,
    slideY,
  };
}

function dispatchMenu(id: MenuId, openOverlay: (id: OverlayId) => void, openProgress: (mode: ProgressMode) => void): void {
  if (id === 'chat') {
    openOverlay('chat');
    return;
  }
  if (id === 'incidents') {
    openOverlay('incidents');
    return;
  }
  if (id === 'calendar') {
    openOverlay('calendar');
    return;
  }
  if (id === 'planning') {
    openOverlay('planning');
    return;
  }
  if (id === 'exercises') {
    openOverlay('library');
    return;
  }
  if (id === 'measures') {
    openOverlay('measures');
    return;
  }
  if (id === 'volume') {
    openProgress('volume');
    return;
  }
  const label = id.charAt(0).toUpperCase() + id.slice(1);
  showComingSoon(label);
}

export function ClientShell(): React.JSX.Element {
  const st = useShellState();
  return (
    <View style={s.root}>
      <View style={[s.glowPink, WEB_BLUR_LG]} />
      <View style={[s.glowBlue, WEB_BLUR_LG]} />
      <HomeHub
        activeMenuIds={st.activeMenuIds}
        onMenuItemPress={(id) => dispatchMenu(id as MenuId, st.openOverlay, st.openProgress)}
        onOpenMenu={() => st.openOverlay('menu')}
        onOpenMood={() => st.openOverlay('mood')}
        onOpenProfile={() => st.openOverlay('profile')}
        onOpenProgress={() => st.openProgress('progress')}
        onOpenRoutine={() => st.openOverlay('routine')}
      />
      {st.overlay === 'profile' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <ProfilePanel onClose={st.closeOverlay} />
        </Animated.View>
      )}
      {st.overlay === 'routine' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <RoutinePanel onClose={st.closeOverlay} onSelectDay={st.openDay} />
        </Animated.View>
      )}
      {st.overlay === 'routineDay' && st.selectedDay !== null && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <DayDetailPanel day={st.selectedDay} onClose={st.closeOverlay} onStartTraining={st.openSession} />
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
      {st.overlay === 'chat' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: st.slideX }] }]}>
          <OverlayBackHeader onClose={st.closeOverlay} title={'Chat'} />
          <ChatScreen />
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
      {st.overlay === 'menu' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateY: st.slideY }] }]}>
          <MenuConfigPanel
            activeIds={st.activeMenuIds}
            onClose={st.closeOverlay}
            onToggle={(id) => {
              st.setActiveMenuIds((prev) => {
                if (prev.includes(id)) return prev.filter((x) => x !== id);
                if (prev.length >= 4) return prev;
                return [...prev, id];
              });
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}
