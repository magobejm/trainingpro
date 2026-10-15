import React, { useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, colors, space, fontSize } from '@trainerpro/ui';
import type { useChatMessagesQuery } from '../../data/hooks/useChat';
import { ChatMessageBubble } from '../../screens/coach/components/ChatMessageBubble';
import { captureChatAnchor, restoreChatAnchor, newChatMessageIds, type ChatAnchor } from './chat-history-scroll';
type Props = {
  query: ReturnType<typeof useChatMessagesQuery>;
  sentVersion: number;
  t: (key: string, options?: Record<string, unknown>) => string;
};
export function ChatHistoryPanel(props: Props): React.JSX.Element {
  const scroll = useRef<ScrollView>(null);
  const reading = useChatReading(scroll, props);
  return (
    <>
      {props.query.refreshError ? (
        <View style={styles.status}>
          <Text>{props.t('chat.history.refreshError')}</Text>
          <Button
            label={props.t('chat.history.retry')}
            onPress={() => void props.query.refetch()}
            size={'sm'}
            variant={'secondary'}
          />
        </View>
      ) : null}
      <ScrollView
        ref={scroll}
        style={styles.viewport}
        contentContainerStyle={styles.messages}
        onScroll={reading.onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={reading.onResize}
        keyboardShouldPersistTaps={'handled'}
        testID={'chat-history-viewport'}
      >
        <View style={styles.historyStatus}>
          {props.query.historyError ? (
            <>
              <Text style={styles.statusText}>{props.t('chat.history.error')}</Text>
              <Button label={props.t('chat.history.retry')} onPress={reading.loadOlder} size={'sm'} variant={'secondary'} />
            </>
          ) : (
            <Text style={styles.statusText}>
              {props.t(
                props.query.isLoadingOlder
                  ? 'chat.history.loading'
                  : props.query.hasOlder
                    ? 'chat.history.more'
                    : 'chat.history.start',
              )}
            </Text>
          )}
        </View>
        {props.query.data.length === 0 ? <Text style={styles.statusText}>{props.t('chat.history.empty')}</Text> : null}
        {props.query.data.map((message) => (
          <View key={message.id} nativeID={'chat-message-' + message.id}>
            <ChatMessageBubble message={message} />
          </View>
        ))}
      </ScrollView>
      {reading.unread > 0 ? (
        <Button
          label={props.t('chat.history.newMessages', { count: reading.unread })}
          onPress={reading.scrollToEnd}
          variant={'secondary'}
        />
      ) : null}
    </>
  );
}
function useChatReading(scroll: React.RefObject<ScrollView | null>, props: Props) {
  const previous = useRef(props.query.data.slice(0, 0));
  const initial = useRef(true);
  const following = useRef(true);
  const anchor = useRef<ChatAnchor>(null);
  const sent = useRef(props.sentVersion);
  const loading = useRef(false);
  const unseen = useRef(new Set<string>());
  const [unread, setUnread] = useState(0);
  const node = () => scroll.current?.getScrollableNode() as HTMLElement | undefined;
  const scrollToEnd = () => {
    const viewport = node();
    if (!viewport) return;
    following.current = true;
    viewport.scrollTop = viewport.scrollHeight;
    unseen.current.clear();
    setUnread(0);
    anchor.current = captureChatAnchor(viewport);
  };
  useLayoutEffect(() => {
    const viewport = node();
    if (!viewport) return;
    viewport.style.overflowAnchor = 'none';
    const own = sent.current !== props.sentVersion;
    if (initial.current || following.current || own) scrollToEnd();
    else {
      for (const id of newChatMessageIds(previous.current, props.query.data)) unseen.current.add(id);
      setUnread(unseen.current.size);
      restoreChatAnchor(viewport, anchor.current);
    }
    initial.current = false;
    sent.current = props.sentVersion;
    previous.current = props.query.data;
    anchor.current = captureChatAnchor(viewport);
  }, [props.query.data, props.sentVersion]);
  const loadOlder = async () => {
    if (loading.current || props.query.isLoadingOlder || !props.query.hasOlder) return;
    const viewport = node();
    if (viewport) anchor.current = captureChatAnchor(viewport);
    loading.current = true;
    try {
      await props.query.loadOlder();
    } finally {
      loading.current = false;
    }
  };
  const onScroll = () => {
    const viewport = node();
    if (!viewport) return;
    following.current = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 96;
    anchor.current = captureChatAnchor(viewport);
    if (following.current) {
      unseen.current.clear();
      setUnread(0);
    }
    if (!initial.current && viewport.scrollTop <= 120 && !props.query.historyError) void loadOlder();
  };
  const onResize = () => {
    const viewport = node();
    if (!viewport) return;
    if (following.current) scrollToEnd();
    else restoreChatAnchor(viewport, anchor.current);
  };
  return { unread, scrollToEnd, loadOlder, onScroll, onResize };
}
const styles = StyleSheet.create({
  viewport: { backgroundColor: colors.background, height: 420, maxHeight: 520, minHeight: 260, width: '100%' },
  messages: { flexGrow: 1, gap: space.sm, padding: space.md, width: '100%' },
  historyStatus: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  status: { padding: space.sm, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  statusText: { color: colors.textMuted, fontSize: fontSize.xs },
});
