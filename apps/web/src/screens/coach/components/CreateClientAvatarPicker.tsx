import React, { useRef } from 'react';
import { Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconButton, colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  avatars: string[];
  onSelect: (avatarUrl: string) => void;
  selectedAvatarUrl: string;
  t: (key: string) => string;
};
const ICON_LEFT = '\u2039';
const ICON_RIGHT = '\u203A';

export function CreateClientAvatarPicker(props: Props): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.t('coach.clients.form.avatarTitle')}</Text>
      <Text style={styles.hint}>{props.t('coach.clients.form.avatarHint')}</Text>
      <AvatarCarousel {...props} />
    </View>
  );
}

function AvatarCarousel(props: Props): React.JSX.Element {
  const offsetRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const dragStartRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const panResponder = createPanResponder(dragOffsetRef, dragStartRef, offsetRef, scrollRef);
  return (
    <View>
      <CarouselHeader offsetRef={offsetRef} scrollRef={scrollRef} t={props.t} />
      <View {...panResponder.panHandlers} style={styles.dragArea}>
        <ScrollView
          horizontal
          onScroll={(event) => (offsetRef.current = event.nativeEvent.contentOffset.x)}
          ref={scrollRef}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.row}>{props.avatars.map((url) => renderAvatar(props, url))}</View>
        </ScrollView>
      </View>
    </View>
  );
}

function renderAvatar(props: Props, avatarUrl: string): React.JSX.Element {
  const selected = props.selectedAvatarUrl === avatarUrl;
  return (
    <Pressable
      key={avatarUrl}
      onPress={() => props.onSelect(avatarUrl)}
      style={[styles.avatarCard, selected ? styles.avatarCardSelected : null]}
    >
      <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
      {selected ? <View style={styles.checkDot} /> : null}
    </Pressable>
  );
}

function CarouselHeader(props: {
  offsetRef: React.RefObject<number>;
  scrollRef: React.RefObject<ScrollView | null>;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.headerRow}>
      <View style={styles.arrowWrap}>
        <Arrow
          isLeft
          label={props.t('coach.clients.form.avatarPrevious')}
          onPress={() => scrollBy(props.scrollRef, props.offsetRef, -300)}
        />
        <Arrow
          isLeft={false}
          label={props.t('coach.clients.form.avatarNext')}
          onPress={() => scrollBy(props.scrollRef, props.offsetRef, 300)}
        />
      </View>
    </View>
  );
}

function Arrow(props: { isLeft: boolean; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <IconButton
      accessibilityLabel={props.label}
      icon={(color) => <Text style={[styles.arrowLabel, { color }]}>{props.isLeft ? ICON_LEFT : ICON_RIGHT}</Text>}
      onPress={props.onPress}
    />
  );
}

function scrollBy(ref: React.RefObject<ScrollView | null>, offsetRef: React.RefObject<number>, delta: number): void {
  const nextX = Math.max(0, offsetRef.current + delta);
  ref.current?.scrollTo({ animated: true, x: nextX });
}

function createPanResponder(
  dragOffsetRef: React.RefObject<number>,
  dragStartRef: React.RefObject<number>,
  offsetRef: React.RefObject<number>,
  scrollRef: React.RefObject<ScrollView | null>,
) {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 4,
    onPanResponderGrant: (_, gestureState) => {
      dragOffsetRef.current = offsetRef.current;
      dragStartRef.current = gestureState.x0;
    },
    onPanResponderMove: (_, gestureState) => {
      const delta = gestureState.moveX - dragStartRef.current;
      const nextX = Math.max(0, dragOffsetRef.current - delta);
      offsetRef.current = nextX;
      scrollRef.current?.scrollTo({ animated: false, x: nextX });
    },
    onStartShouldSetPanResponder: () => false,
  });
}

const styles = StyleSheet.create({
  arrowLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  arrowWrap: {
    flexDirection: 'row',
    gap: space.sm,
  },
  avatarCard: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 74,
    overflow: 'hidden',
    width: 74,
  },
  avatarCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  avatarImage: {
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  checkDot: {
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: 6,
    top: 6,
    width: 14,
  },
  dragArea: {
    width: '100%',
  },
  field: {
    gap: space.xs,
    marginTop: 2,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: space.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
    paddingVertical: space.xs,
  },
});
