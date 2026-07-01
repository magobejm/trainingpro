import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Banner } from '@trainerpro/ui';
import '../../i18n';
import {
  useChatMessagesQuery,
  useClientThreadQuery,
  useSendChatMessageMutation,
  type ChatMessage,
} from '../../data/hooks/useChat';
import { AttachmentsPicker, type AttachmentDraft } from '../../features/chat/AttachmentsPicker';
import { LIGHT } from '../../theme/light';

type ChatScreenProps = {
  embedded?: boolean;
};

export function ChatScreen(props: ChatScreenProps): React.JSX.Element {
  const vm = useChatViewModel();
  return <ChatView embedded={props.embedded} {...vm} />;
}

function useChatViewModel() {
  const { t } = useTranslation();
  const threadId = useThreadId();
  const messagesQuery = useChatMessagesQuery(threadId);
  const composer = useMessageComposer(threadId, t);
  return { ...composer, messagesQuery, t, threadId };
}

function useThreadId(): string {
  const threadQuery = useClientThreadQuery();
  return threadQuery.data?.id ?? '';
}

function useMessageComposer(threadId: string, t: (key: string) => string) {
  const sendMessage = useSendChatMessageMutation(threadId);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const canSend = useMemo(() => canSendMessage(text, attachments, threadId), [attachments, text, threadId]);
  const onAttach = (attachment: AttachmentDraft) => setAttachments((current) => [...current, attachment]);
  const onSend = () =>
    sendChatMessage(canSend, sendMessage, {
      attachments,
      setAttachments,
      setError,
      setText,
      t,
      text,
    });
  return { attachments, canSend, error, onAttach, onSend, setError, setText, text };
}

async function sendChatMessage(
  canSend: boolean,
  mutation: ReturnType<typeof useSendChatMessageMutation>,
  state: {
    attachments: AttachmentDraft[];
    setAttachments: (value: AttachmentDraft[]) => void;
    setError: (value: string) => void;
    setText: (value: string) => void;
    t: (key: string) => string;
    text: string;
  },
): Promise<void> {
  if (!canSend) return;
  try {
    await mutation.mutateAsync({ attachments: state.attachments, text: state.text });
    state.setText('');
    state.setAttachments([]);
    state.setError('');
  } catch {
    state.setError(state.t('client.chat.error'));
  }
}

function canSendMessage(text: string, attachments: AttachmentDraft[], threadId: string): boolean {
  const hasText = text.trim().length > 0;
  return (hasText || attachments.length > 0) && threadId.length > 0;
}

type ViewModel = ReturnType<typeof useChatViewModel> & { embedded?: boolean };

function ChatView(props: ViewModel) {
  if (props.threadId && props.messagesQuery.isLoading) {
    return (
      <View style={[styles.page, props.embedded && styles.pageEmbedded]}>
        <ActivityIndicator color={LIGHT.accent} />
      </View>
    );
  }
  const content = (
    <>
      {props.embedded ? (
        <View style={styles.embeddedHeader}>
          <View style={styles.embeddedAvatar}>
            <Text style={{ fontSize: 24 }}>{'👤'}</Text>
          </View>
          <View>
            <Text style={styles.embeddedCoachName}>{props.t('mobile.client.chat.coach')}</Text>
            <Text style={styles.embeddedOnline}>{props.t('mobile.client.chat.online')}</Text>
          </View>
        </View>
      ) : (
        <ChatHeader
          retentionTitle={props.t('client.chat.retention.title')}
          subtitle={props.t('client.chat.retention.subtitle')}
          title={props.t('client.chat.title')}
        />
      )}
      <ScrollView contentContainerStyle={styles.messagesScroll} style={styles.messagesArea}>
        <View style={styles.todayPill}>
          <Text style={styles.todayPillText}>{props.t('mobile.client.chat.today')}</Text>
        </View>
        <View style={styles.messages}>{renderMessages(props.messagesQuery.data ?? [], props.t)}</View>
      </ScrollView>
      <ChatComposer {...props} embedded={props.embedded} />
    </>
  );

  if (props.embedded) {
    return <View style={[styles.page, styles.pageEmbedded]}>{content}</View>;
  }
  return <ScrollView contentContainerStyle={styles.page}>{content}</ScrollView>;
}

function ChatHeader(props: { retentionTitle: string; subtitle: string; title: string }) {
  return (
    <>
      <Text style={styles.title}>{props.title}</Text>
      <Banner subtitle={props.subtitle} title={props.retentionTitle} />
    </>
  );
}

function ChatComposer(props: ViewModel & { embedded?: boolean }) {
  return (
    <View style={[styles.inputPanel, props.embedded && styles.inputPanelEmbedded]}>
      <View style={styles.inputRow}>
        <Text style={{ fontSize: 22, marginRight: 8 }}>{'😊'}</Text>
        <TextInput
          multiline
          onChangeText={props.setText}
          placeholder={props.t('client.chat.placeholder')}
          placeholderTextColor={LIGHT.accentMuted}
          style={styles.textInput}
          value={props.text}
        />
      </View>
      <AttachmentsPicker onAttach={props.onAttach} onError={props.setError} threadId={props.threadId} />
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
      <Pressable onPress={props.onSend} style={styles.sendButton}>
        <Text style={styles.sendLabel}>{props.t('client.chat.send')}</Text>
      </Pressable>
    </View>
  );
}

function renderMessages(messages: ChatMessage[], t: (key: string) => string) {
  if (messages.length === 0) {
    return <Text style={styles.empty}>{t('client.chat.empty')}</Text>;
  }
  return messages.map((message) => <MessageBubble key={message.id} message={message} />);
}

function MessageBubble(props: { message: ChatMessage }) {
  const isClient = props.message.senderRole === 'CLIENT';
  return (
    <View style={[styles.bubble, isClient ? styles.bubbleClient : styles.bubbleCoach]}>
      {props.message.text ? <Text style={styles.bubbleText}>{props.message.text}</Text> : null}
      {props.message.attachments.map((attachment) => (
        <Text key={attachment.storagePath} style={styles.attachmentItem}>
          {attachment.fileName}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: LIGHT.bgSoft,
    gap: 10,
    minHeight: '100%',
    padding: 14,
  },
  pageEmbedded: {
    flex: 1,
    minHeight: undefined,
    padding: 0,
    paddingBottom: 80,
  },
  embeddedHeader: {
    alignItems: 'center',
    backgroundColor: LIGHT.emeraldBg,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  embeddedAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: LIGHT.radiusFull,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  embeddedCoachName: { color: LIGHT.textOnNavy, fontSize: 16, fontWeight: '800' },
  embeddedOnline: { color: LIGHT.emeraldSoft, fontSize: 12, fontWeight: '500' },
  messagesArea: { flex: 1 },
  messagesScroll: { gap: 8, padding: 16, paddingBottom: 8 },
  todayPill: {
    alignSelf: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusSm,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  todayPillText: {
    color: LIGHT.accent,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  attachmentItem: { color: LIGHT.textMuted, fontSize: 11, fontWeight: '600' },
  bubble: {
    borderRadius: 16,
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleClient: {
    alignSelf: 'flex-end',
    backgroundColor: LIGHT.emeraldSoft,
    borderColor: LIGHT.emerald,
    borderWidth: 1,
  },
  bubbleCoach: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderWidth: 1,
  },
  bubbleText: { color: LIGHT.textStrong, fontSize: 15 },
  empty: { color: LIGHT.textMuted, fontSize: 13 },
  error: { color: LIGHT.error, fontSize: 12, fontWeight: '700' },
  inputPanel: {
    backgroundColor: LIGHT.bg,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusMd,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
    padding: 10,
    width: '100%',
  },
  inputPanelEmbedded: {
    borderRadius: 0,
    borderWidth: 0,
    borderTopColor: LIGHT.borderStrong,
    borderTopWidth: 1,
    marginTop: 0,
  },
  inputRow: { alignItems: 'flex-end', flexDirection: 'row' },
  messages: { gap: 8, width: '100%' },
  sendButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: LIGHT.emeraldBg,
    borderRadius: LIGHT.radiusFull,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendLabel: { color: LIGHT.textOnNavy, fontSize: 13, fontWeight: '800' },
  textInput: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusXl,
    borderWidth: 1,
    color: LIGHT.textStrong,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textAlignVertical: 'center',
  },
  title: { color: LIGHT.textStrong, fontSize: 24, fontWeight: '800' },
});
