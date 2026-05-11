import React, { useCallback, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import type { ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { ProgressScreen } from '../../screens/client/ProgressScreen';
import { TodaySessionScreen } from '../../screens/client/TodaySessionScreen';
import { SPRING, WEB_BLUR_LG, type OverlayId } from './client-shell.constants';
import { s } from './client-shell.styles';
import { HomeHub } from './ClientShellHome';
import { DayDetailPanel, MenuConfigPanel, ProfilePanel, RoutinePanel } from './ClientShellPanels';

type ShellState = {
  activeMenuIds: string[];
  activeSessionId: string | null;
  overlay: OverlayId;
  selectedDay: ClientRoutineDay | null;
  slideX: Animated.Value;
  slideY: Animated.Value;
  closeOverlay: () => void;
  openDay: (day: ClientRoutineDay) => void;
  openOverlay: (id: OverlayId) => void;
  openSession: (sessionId: string) => void;
  setActiveMenuIds: React.Dispatch<React.SetStateAction<string[]>>;
};

function useShellState(): ShellState {
  const [overlay, setOverlay] = useState<OverlayId>(null);
  const [selectedDay, setSelectedDay] = useState<ClientRoutineDay | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeMenuIds, setActiveMenuIds] = useState<string[]>(['measures', 'notes', 'chat', 'incidents']);
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
      if (overlay === 'routineDay') setSelectedDay(null);
      if (overlay === 'session') setActiveSessionId(null);
    });
  }, [overlay, slideX, slideY]);

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
    openSession,
    overlay,
    selectedDay,
    setActiveMenuIds,
    slideX,
    slideY,
  };
}

export function ClientShell(): React.JSX.Element {
  const st = useShellState();
  return (
    <View style={s.root}>
      <View style={[s.glowPink, WEB_BLUR_LG]} />
      <View style={[s.glowBlue, WEB_BLUR_LG]} />
      <HomeHub
        activeMenuIds={st.activeMenuIds}
        onOpenMenu={() => st.openOverlay('menu')}
        onOpenProfile={() => st.openOverlay('profile')}
        onOpenProgress={() => st.openOverlay('progress')}
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
          <ProgressScreen onClose={st.closeOverlay} />
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
