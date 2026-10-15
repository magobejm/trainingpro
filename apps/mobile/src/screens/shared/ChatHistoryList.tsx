import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { ChatMessage, useChatMessagesQuery } from '../../data/hooks/useChat';
import { useChatListAnchor } from './useChatListAnchor';
import { LIGHT } from '../../theme/light';
import { appendedMessageCount, messageDateLabel, messageDay, shouldLoadHistory } from './chat-history-list-state';

type Props = {
  query: ReturnType<typeof useChatMessagesQuery>;
  renderMessage: (message: ChatMessage) => React.ReactElement;
  sentVersion: number;
};

export function ChatHistoryList({ query, renderMessage, sentVersion }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { list, anchor, data, unread, jumpToEnd, onScroll, onContentSizeChange, onLayout, loadOlder, beginReading } =
    useListReading(query, sentVersion);
  return (
    <View style={styles.area}>
      <FlatList
        testID={'chat-history-mobile-viewport'}
        contentContainerStyle={styles.content}
        data={data}
        keyExtractor={(message) => message.id}
        ListEmptyComponent={<Text style={styles.status}>{t('chat.history.empty')}</Text>}
        ListHeaderComponent={<HistoryStatus query={query} retry={() => void loadOlder()} />}
        maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        onScroll={onScroll}
        onScrollBeginDrag={beginReading}
        onTouchStart={beginReading}
        onViewableItemsChanged={anchor.onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 1 }}
        ref={list}
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            {index === 0 || messageDay(data[index - 1]?.createdAt ?? '') !== messageDay(item.createdAt) ? (
              <View style={styles.datePill}>
                <Text style={styles.dateText}>
                  {messageDateLabel(item.createdAt, i18n.language, t('chat.history.today'))}
                </Text>
              </View>
            ) : null}
            <View
              nativeID={'chat-message-' + item.id}
              ref={(row) => {
                if (row) anchor.rows.current.set(item.id, row);
                else anchor.rows.current.delete(item.id);
              }}
              onLayout={() => anchor.restore(data[0]?.id)}
            >
              {renderMessage(item)}
            </View>
          </View>
        )}
        scrollEventThrottle={16}
        style={styles.area}
      />
      {unread > 0 ? (
        <Pressable accessibilityRole={'button'} onPress={jumpToEnd} style={styles.newMessages}>
          <Text style={styles.newMessagesText}>{t('chat.history.newMessages', { count: unread })}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function useListReading(query: Props['query'], sentVersion: number) {
  const list = useRef<FlatList<ChatMessage>>(null);
  const anchor = useChatListAnchor(list);
  const initialized = useRef(false);
  const positioning = useRef(true);
  const interacted = useRef(false);
  const beginReading = () => {
    anchor.cancel();
    interacted.current = true;
    positioning.current = false;
  };
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = list.current?.getScrollableNode() as EventTarget | undefined;
    const events = ['wheel', 'pointerdown', 'keydown'];
    events.forEach((event) => node?.addEventListener(event, beginReading));
    return () => events.forEach((event) => node?.removeEventListener(event, beginReading));
  }, []);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const previous = useRef<ChatMessage[]>([]);
  const nearBottom = useRef(true);
  const follow = useRef(true);
  const loading = useRef(false);
  const [unread, setUnread] = useState(0);
  const data = query.data ?? [];
  const positionAtEnd = () => {
    if (!viewportHeight.current || !contentHeight.current) return;
    list.current?.scrollToOffset({
      offset: Math.max(0, contentHeight.current - viewportHeight.current),
      animated: false,
    });
    requestAnimationFrame(() => {
      initialized.current = true;
      positioning.current = false;
    });
  };
  const jumpToEnd = () => {
    anchor.cancel();
    interacted.current = false;
    nearBottom.current = true;
    follow.current = true;
    positioning.current = true;
    setUnread(0);
    positionAtEnd();
  };
  useLayoutEffect(() => {
    const added = appendedMessageCount(previous.current, data);
    previous.current = data;
    if (!added) return;
    if (nearBottom.current) follow.current = true;
    else setUnread((count) => count + added);
  }, [data]);
  useLayoutEffect(() => {
    jumpToEnd();
    follow.current = true;
  }, [sentVersion]);
  const loadOlder = async () => {
    if (loading.current || query.isLoadingOlder) return;
    loading.current = true;
    try {
      await anchor.capture(data[0]?.id);
      await query.loadOlder();
    } finally {
      loading.current = false;
    }
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    anchor.offset.current = contentOffset.y;
    const isNearBottom = contentSize.height - layoutMeasurement.height - contentOffset.y < 96;
    if (!isNearBottom && (positioning.current || !interacted.current)) return;
    nearBottom.current = isNearBottom;
    if (nearBottom.current) setUnread(0);
    else if (initialized.current && interacted.current) follow.current = false;
    if (
      initialized.current &&
      interacted.current &&
      !anchor.pending.current &&
      shouldLoadHistory(contentOffset.y, query.hasOlder, query.isLoadingOlder, query.historyError)
    )
      void loadOlder();
  };
  const onContentSizeChange = (_width: number, height: number) => {
    contentHeight.current = height;
    anchor.restore(data[0]?.id);
    if (follow.current && data.length) {
      positioning.current = true;
      requestAnimationFrame(positionAtEnd);
    }
  };
  const onLayout = (event: import('react-native').LayoutChangeEvent) => {
    viewportHeight.current = event.nativeEvent.layout.height;
    if (follow.current && data.length) requestAnimationFrame(positionAtEnd);
  };
  return { list, anchor, data, unread, jumpToEnd, onScroll, onContentSizeChange, onLayout, loadOlder, beginReading };
}

function HistoryStatus({ query, retry }: { query: Props['query']; retry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.historyStatus}>
      {query.isLoadingOlder ? (
        <ActivityIndicator color={LIGHT.accent} />
      ) : (
        <>
          {!query.hasOlder && !query.isLoading ? <Text>{t('chat.history.start')}</Text> : null}
          {query.historyError ? <RetryNotice label={t('chat.history.error')} retry={retry} /> : null}
          {query.refreshError || query.isError ? (
            <RetryNotice label={t('chat.history.refreshError')} retry={() => void query.refetch()} />
          ) : null}
        </>
      )}
    </View>
  );
}

function RetryNotice({ label, retry }: { label: string; retry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.notice}>
      <Text style={styles.error}>{label}</Text>
      <Pressable accessibilityRole={'button'} onPress={retry}>
        <Text style={styles.retry}>{t('chat.history.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1, minHeight: 0 },
  content: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  item: { paddingVertical: 4 },
  status: { alignItems: 'center', paddingVertical: 8, color: LIGHT.textMuted },
  historyStatus: { minHeight: 72, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  notice: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  error: { color: LIGHT.error, fontSize: 12 },
  retry: { color: LIGHT.accent, fontWeight: '700' },
  datePill: {
    alignSelf: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusSm,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dateText: { color: LIGHT.accent, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  newMessages: {
    alignSelf: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusFull,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 6,
  },
  newMessagesText: { color: LIGHT.textOnNavy, fontWeight: '700' },
});
