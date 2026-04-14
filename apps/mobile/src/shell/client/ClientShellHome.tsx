import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useClientMeQuery, resolveDisplayName, type ClientMe } from '../../data/hooks/useClientMeQuery';
import { MENU_ITEMS, WEB_BLUR_SM, type MenuItem } from './client-shell.constants';
import { AvatarImage, FloatingCircle } from './client-shell.primitives';
import { s } from './client-shell.styles';

type HomeHubProps = {
  activeMenuIds: string[];
  onOpenMenu: () => void;
  onOpenProfile: () => void;
  onOpenRoutine: () => void;
};

export function HomeHub(props: HomeHubProps): React.JSX.Element {
  const { data: client } = useClientMeQuery();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  const avatarY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] });

  return (
    <View style={s.hubWrapper}>
      <ProfileCard client={client} onPress={props.onOpenProfile} />
      <View style={s.hub}>
        <FloatingCircle emoji={'🏋️'} label={'RUTINA'} onPress={props.onOpenRoutine} position={s.circleTopLeft} />
        <FloatingCircle emoji={'🍽️'} label={'DIETA'} position={s.circleTopRight} />
        <Animated.View style={[s.centerAvatar, { transform: [{ translateY: avatarY }] }]}>
          <AvatarImage avatarUrl={client?.avatarUrl ?? null} size={148} />
        </Animated.View>
        <FloatingCircle emoji={'😊'} label={'ÁNIMO'} position={s.circleBottomLeft} />
        <FloatingCircle emoji={'📈'} label={'PROGRESO'} position={s.circleBottomRight} />
      </View>
      <BottomBar activeMenuIds={props.activeMenuIds} onOpenMenu={props.onOpenMenu} />
    </View>
  );
}

function ProfileCard(props: { client: ClientMe | undefined; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[s.profileCard, WEB_BLUR_SM]}>
      <View style={s.profileCardAvatar}>
        <AvatarImage avatarUrl={props.client?.avatarUrl ?? null} size={52} />
      </View>
      <View style={s.profileCardInfo}>
        <Text style={s.profileCardName}>{resolveDisplayName(props.client)}</Text>
        {props.client?.lastName ? <Text style={s.profileCardSub}>{props.client.lastName}</Text> : null}
        {props.client?.objective ? (
          <View style={s.goalBadge}>
            <Text style={s.goalBadgeText}>{props.client.objective}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function BottomBar(props: { activeMenuIds: string[]; onOpenMenu: () => void }): React.JSX.Element {
  const items = useMemo(
    () => props.activeMenuIds.map((id) => MENU_ITEMS.find((m) => m.id === id)).filter(Boolean) as MenuItem[],
    [props.activeMenuIds],
  );
  return (
    <View>
      <View style={s.chevronRow}>
        <Pressable onPress={props.onOpenMenu} style={[s.chevronBtn, WEB_BLUR_SM]}>
          <Text style={s.chevronIcon}>{'⌃'}</Text>
        </Pressable>
      </View>
      <View style={[s.bar, WEB_BLUR_SM]}>
        {items.map((item) => (
          <BottomBarItem key={item.id} emoji={item.emoji} label={item.label} />
        ))}
      </View>
    </View>
  );
}

function BottomBarItem(props: { emoji: string; label: string }): React.JSX.Element {
  return (
    <View style={s.barItem}>
      <View style={s.barIconWrap}>
        <Text style={s.barEmoji}>{props.emoji}</Text>
      </View>
      <Text style={s.barLabel}>{props.label}</Text>
    </View>
  );
}
