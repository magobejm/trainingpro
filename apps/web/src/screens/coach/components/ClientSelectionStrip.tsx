import React, { useRef } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ClientRowCard } from './ClientRowCard';
const DIR_LEFT = 'left' as const;
const DIR_RIGHT = 'right' as const;

export type ClientSelectorItem = {
  avatarUrl: null | string;
  id: string;
  name: string;
  objective?: string;
  progressTitle?: string;
  progressLabel?: string;
  statusTone?: 'success' | 'warning';
  weightLabel?: string;
  weightTitle?: string;
};

type Props = {
  emptyLabel: string;
  headerContent?: React.ReactNode;
  items: ClientSelectorItem[];
  loading: boolean;
  onSelect: (id: string) => void;
  selectedId: string;
  showArrows?: boolean;
};

export function ClientSelectionStrip(props: Props): React.JSX.Element {
  if (props.loading) {
    return <Text style={styles.info}>{props.emptyLabel}</Text>;
  }
  if (props.items.length === 0) {
    return <Text style={styles.info}>{props.emptyLabel}</Text>;
  }
  return <HorizontalList {...props} />;
}

function HorizontalList(props: Props): React.JSX.Element {
  const vm = useHorizontalListModel(props.onSelect);
  return (
    <View style={styles.wrap}>
      <ArrowControls
        headerContent={props.headerContent}
        offsetRef={vm.offsetRef}
        scrollRef={vm.scrollRef}
        show={props.showArrows}
      />
      <CardsRow
        offsetRef={vm.offsetRef}
        panHandlers={vm.panHandlers}
        onSelect={vm.guardedSelect}
        props={props}
        scrollRef={vm.scrollRef}
      />
    </View>
  );
}

function useHorizontalListModel(onSelect: (id: string) => void) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const dragStartRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const blockSelectionRef = useRef(false);
  const panResponder = createPanResponder(
    blockSelectionRef,
    dragOffsetRef,
    dragStartRef,
    offsetRef,
    scrollRef,
  );
  const guardedSelect = (id: string) => {
    if (blockSelectionRef.current) {
      return;
    }
    onSelect(id);
  };
  return { guardedSelect, offsetRef, panHandlers: panResponder.panHandlers, scrollRef };
}

function CardsRow(props: {
  offsetRef: React.RefObject<number>;
  onSelect: (id: string) => void;
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
  props: Props;
  scrollRef: React.RefObject<ScrollView | null>;
}): React.JSX.Element {
  const cards = renderClientCards(props.props, props.onSelect);
  return (
    <View {...props.panHandlers} style={styles.dragArea}>
      <ScrollView
        horizontal
        onScroll={(event) => (props.offsetRef.current = event.nativeEvent.contentOffset.x)}
        ref={props.scrollRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.row}>{cards}</View>
      </ScrollView>
    </View>
  );
}

function renderClientCards(props: Props, onSelect: (id: string) => void): React.JSX.Element[] {
  return props.items.map((item) => (
    <ClientRowCard
      avatarUrl={item.avatarUrl}
      id={item.id}
      key={item.id}
      name={item.name}
      onSelect={onSelect}
      objective={item.objective}
      progressLabel={item.progressLabel}
      progressTitle={item.progressTitle}
      selected={props.selectedId === item.id}
      statusTone={item.statusTone ?? 'success'}
      weightLabel={item.weightLabel}
      weightTitle={item.weightTitle}
    />
  ));
}

function ArrowControls(props: {
  headerContent?: React.ReactNode;
  offsetRef: React.RefObject<number>;
  scrollRef: React.RefObject<ScrollView | null>;
  show?: boolean;
}): React.JSX.Element {
  if (!props.show) {
    return <View style={styles.headerRow}>{props.headerContent}</View>;
  }
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerContentWrap}>{props.headerContent}</View>
      <View style={styles.arrowWrap}>
        <Arrow
          direction={DIR_LEFT}
          onPress={() => scrollBy(props.scrollRef, props.offsetRef, -320)}
        />
        <Arrow
          direction={DIR_RIGHT}
          onPress={() => scrollBy(props.scrollRef, props.offsetRef, 320)}
        />
      </View>
    </View>
  );
}

function Arrow(props: { direction: 'left' | 'right'; onPress: () => void }): React.JSX.Element {
  const symbol = props.direction === 'left' ? '<' : '>';
  return (
    <Pressable onPress={props.onPress} style={styles.arrowButton}>
      <Text style={styles.arrowLabel}>{symbol}</Text>
    </Pressable>
  );
}

function scrollBy(
  ref: React.RefObject<ScrollView | null>,
  offsetRef: React.RefObject<number>,
  delta: number,
): void {
  const nextX = Math.max(0, offsetRef.current + delta);
  ref.current?.scrollTo({ animated: true, x: nextX });
}

function createPanResponder(
  blockSelectionRef: React.RefObject<boolean>,
  dragOffsetRef: React.RefObject<number>,
  dragStartRef: React.RefObject<number>,
  offsetRef: React.RefObject<number>,
  scrollRef: React.RefObject<ScrollView | null>,
) {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 4,
    onPanResponderGrant: (_, gestureState) => {
      blockSelectionRef.current = false;
      dragOffsetRef.current = offsetRef.current;
      dragStartRef.current = gestureState.x0;
    },
    onPanResponderMove: (_, gestureState) => {
      blockSelectionRef.current = true;
      const delta = gestureState.moveX - dragStartRef.current;
      const nextX = Math.max(0, dragOffsetRef.current - delta);
      offsetRef.current = nextX;
      scrollRef.current?.scrollTo({ animated: false, x: nextX });
    },
    onPanResponderRelease: () => {
      setTimeout(() => {
        blockSelectionRef.current = false;
      }, 0);
    },
    onStartShouldSetPanResponder: () => false,
  });
}

const styles = StyleSheet.create({
  info: {
    color: '#5d6f85',
    fontSize: 13,
  },
  arrowButton: {
    alignItems: 'center',
    backgroundColor: '#f6f8fb',
    borderColor: '#d7dfe9',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  arrowLabel: {
    color: '#637088',
    fontSize: 16,
    fontWeight: '700',
  },
  arrowWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  headerContentWrap: {
    flex: 1,
  },
  dragArea: {
    width: '100%',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 4,
  },
  wrap: {
    width: '100%',
  },
});
