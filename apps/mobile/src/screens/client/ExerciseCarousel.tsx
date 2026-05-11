import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import '../../i18n';
import type { BlockSessionItem, SessionItem, StrengthSessionItem } from '../../data/hooks/useTodaySession';
import type { SessionSetRowProps } from './SessionSetRow';
import { ActiveExerciseCard } from './ActiveExerciseCard';

const PAGE_H_PADDING = 16;

type CarouselProps = {
  items: SessionItem[];
  onLogSet: SessionSetRowProps['onLogSet'];
};

type NavProps = {
  canGoNext: boolean;
  canGoPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
};

const TYPE_BADGE: Record<BlockSessionItem['type'], { bg: string; label: string; text: string }> = {
  isometric: { bg: 'rgba(251,146,60,0.2)', label: 'Isométrico', text: '#fb923c' },
  mobility: { bg: 'rgba(52,211,153,0.2)', label: 'Movilidad', text: '#34d399' },
  plio: { bg: 'rgba(250,204,21,0.2)', label: 'Pliométrico', text: '#facc15' },
  sport: { bg: 'rgba(167,139,250,0.2)', label: 'Deporte', text: '#a78bfa' },
};

function findFirstUncompleted(items: SessionItem[]): number {
  const idx = items.findIndex((it) => it.type === 'strength' && it.logs.length < (it.setsPlanned ?? 0));
  return idx === -1 ? 0 : idx;
}

function useCarouselState(items: SessionItem[], pageWidth: number) {
  const listRef = useRef<FlatList<SessionItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(() => findFirstUncompleted(items));
  const lastAdvancedFromRef = useRef<number>(-1);

  const scrollTo = useCallback((index: number) => {
    listRef.current?.scrollToIndex({ animated: true, index });
    setCurrentIndex(index);
  }, []);

  useEffect(() => {
    const item = items[currentIndex];
    if (!item || item.type !== 'strength') return;
    const done = item.logs.length;
    const planned = item.setsPlanned ?? 0;
    const canAdvance = done >= planned && planned > 0 && currentIndex < items.length - 1;
    if (canAdvance && lastAdvancedFromRef.current !== currentIndex) {
      lastAdvancedFromRef.current = currentIndex;
      scrollTo(currentIndex + 1);
    }
  }, [currentIndex, items, scrollTo]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const newIndex = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      setCurrentIndex(newIndex);
    },
    [pageWidth],
  );

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) scrollTo(currentIndex + 1);
  }, [currentIndex, items.length, scrollTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) scrollTo(currentIndex - 1);
  }, [currentIndex, scrollTo]);

  return { currentIndex, goNext, goPrev, listRef, onMomentumScrollEnd };
}

function BlockCard(props: { item: BlockSessionItem }): React.JSX.Element {
  const badge = TYPE_BADGE[props.item.type];
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.headerRow}>
        <Text style={cardStyles.name}>{props.item.displayName}</Text>
        <View style={[cardStyles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[cardStyles.badgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>
      {Boolean(props.item.meta) && <Text style={cardStyles.meta}>{props.item.meta}</Text>}
    </View>
  );
}

function PageItem(props: { item: SessionItem; onLogSet: SessionSetRowProps['onLogSet']; width: number }): React.JSX.Element {
  if (props.item.type === 'strength') {
    return (
      <View style={{ width: props.width }}>
        <ActiveExerciseCard item={props.item as StrengthSessionItem} onLogSet={props.onLogSet} />
      </View>
    );
  }
  return (
    <View style={{ width: props.width }}>
      <BlockCard item={props.item} />
    </View>
  );
}

function CarouselNav(props: NavProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.navRow}>
      <Pressable
        disabled={!props.canGoPrev}
        onPress={props.onPrev}
        style={[styles.navBtn, !props.canGoPrev && styles.navBtnDisabled]}
      >
        <Text style={styles.navBtnLabel}>{t('client.today.prevExercise')}</Text>
      </Pressable>
      <Pressable
        disabled={!props.canGoNext}
        onPress={props.onNext}
        style={[styles.navBtn, !props.canGoNext && styles.navBtnDisabled]}
      >
        <Text style={styles.navBtnLabel}>{t('client.today.nextExercise')}</Text>
      </Pressable>
    </View>
  );
}

export function ExerciseCarousel(props: CarouselProps): React.JSX.Element {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const pageWidth = width - PAGE_H_PADDING * 2;
  const { currentIndex, goNext, goPrev, listRef, onMomentumScrollEnd } = useCarouselState(props.items, pageWidth);

  const renderItem = useCallback(
    ({ item }: { item: SessionItem }) => <PageItem item={item} onLogSet={props.onLogSet} width={pageWidth} />,
    [pageWidth, props.onLogSet],
  );

  if (props.items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{t('client.today.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.counter}>
        {t('client.today.exerciseOf', { current: currentIndex + 1, total: props.items.length })}
      </Text>
      <FlatList
        ref={listRef}
        data={props.items}
        getItemLayout={(_, index) => ({ index, length: pageWidth, offset: pageWidth * index })}
        horizontal
        initialScrollIndex={currentIndex}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={onMomentumScrollEnd}
        pagingEnabled
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
      <CarouselNav
        canGoNext={currentIndex < props.items.length - 1}
        canGoPrev={currentIndex > 0}
        onNext={goNext}
        onPrev={goPrev}
      />
    </View>
  );
}

const COLORS = {
  card: 'rgba(0,0,0,0.55)',
  muted: 'rgba(196,181,253,0.7)',
  text: '#ffffff',
};

const cardStyles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 10,
    padding: 16,
    width: '100%',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  meta: {
    color: COLORS.muted,
    fontSize: 13,
  },
  name: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  counter: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyWrap: {
    padding: 16,
    width: '100%',
  },
  navBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(139,92,246,0.25)',
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 8,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  wrap: {
    width: '100%',
  },
});
