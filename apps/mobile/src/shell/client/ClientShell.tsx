import React, { useCallback, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import type { ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import { SPRING, WEB_BLUR_LG, type OverlayId } from './client-shell.constants';
import { s } from './client-shell.styles';
import { HomeHub } from './ClientShellHome';
import { DayDetailPanel, MenuConfigPanel, ProfilePanel, RoutinePanel } from './ClientShellPanels';

export function ClientShell(): React.JSX.Element {
  const [overlay, setOverlay] = useState<OverlayId>(null);
  const [selectedDay, setSelectedDay] = useState<ClientRoutineDay | null>(null);
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
      if (overlay === 'routineDay') {
        setSelectedDay(null);
      }
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

  return (
    <View style={s.root}>
      <View style={[s.glowPink, WEB_BLUR_LG]} />
      <View style={[s.glowBlue, WEB_BLUR_LG]} />
      <HomeHub
        activeMenuIds={activeMenuIds}
        onOpenMenu={() => openOverlay('menu')}
        onOpenProfile={() => openOverlay('profile')}
        onOpenRoutine={() => openOverlay('routine')}
      />
      {overlay === 'profile' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: slideX }] }]}>
          <ProfilePanel onClose={closeOverlay} />
        </Animated.View>
      )}
      {overlay === 'routine' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: slideX }] }]}>
          <RoutinePanel onClose={closeOverlay} onSelectDay={openDay} />
        </Animated.View>
      )}
      {overlay === 'routineDay' && selectedDay !== null && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateX: slideX }] }]}>
          <DayDetailPanel day={selectedDay} onClose={closeOverlay} />
        </Animated.View>
      )}
      {overlay === 'menu' && (
        <Animated.View style={[s.fullOverlay, { transform: [{ translateY: slideY }] }]}>
          <MenuConfigPanel
            activeIds={activeMenuIds}
            onClose={closeOverlay}
            onToggle={(id) => {
              setActiveMenuIds((prev) => {
                if (prev.includes(id)) {
                  return prev.filter((x) => x !== id);
                }
                if (prev.length >= 4) {
                  return prev;
                }
                return [...prev, id];
              });
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}
