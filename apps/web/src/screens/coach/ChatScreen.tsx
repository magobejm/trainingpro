import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { QueryResult } from '../../components/AsyncStatus';
import { Banner, Button, ClientCardRow, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';
import '../../i18n';
import { useClientsQuery } from '../../data/hooks/useClientsQuery';
import { useChatMessagesQuery, useCoachThreadQuery, useSendChatMessageMutation } from '../../data/hooks/useChat';
import { AttachmentsPicker, type AttachmentDraft } from '../../features/chat/AttachmentsPicker';
import { clientCardItems } from './client-card-items';
import { LIST_KEYS } from '../../layout/list-context';
import { reviveClientId, useListContext, useRouteClient } from '../../layout/useListContext';
import { ChatHistoryPanel } from '../../features/chat/ChatHistoryPanel';

export function ChatScreen(): React.JSX.Element {
  const vm = useChatViewModel();
  return <ChatView {...vm} />;
}

function useChatViewModel() {
  const { t } = useTranslation();
  const clientsQuery = useClientsQuery();
  const [client, setClient] = useListContext(LIST_KEYS.chat, { clientId: '' }, reviveClientId);
  const clientId = client.clientId;
  const setClientId = (nextId: string) => setClient({ clientId: nextId });
  useRouteClient(clientId);
  useDefaultClient(clientId, clientsQuery.data, setClientId);
  const threadQuery = useCoachThreadQuery(clientId);
  const threadId = threadQuery.data?.id ?? '';
  const messagesQuery = useChatMessagesQuery(threadId);
  const clientItems = useMemo(() => clientCardItems(clientsQuery.data ?? [], t), [clientsQuery.data, t]);
  return {
    clientId,
    clientItems,
    clientsQuery,
    messagesQuery,
    setClientId,
    threadQuery,
    t,
    threadId,
  };
}

function useDefaultClient(
  clientId: string,
  clients: Array<{ id: string }> | undefined,
  setClientId: (value: string) => void,
): void {
  useEffect(() => {
    if (!clientId && clients?.[0]) {
      setClientId(clients[0].id);
    }
  }, [clientId, clients, setClientId]);
}

function useMessageComposer(threadId: string, t: (key: string) => string) {
  const sendMessage = useSendChatMessageMutation(threadId);
  const [text, setText] = useState('');
  const [sentVersion, setSentVersion] = useState(0);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const canSend = useMemo(() => canSendMessage(text, attachments, threadId), [attachments, text, threadId]);
  const onAttach = (attachment: AttachmentDraft) => setAttachments((current) => [...current, attachment]);
  const onSend = () =>
    sendChatMessage(canSend, sendMessage, {
      attachments,
      onSent: () => setSentVersion((value) => value + 1),
      setAttachments,
      setError,
      setText,
      t,
      text,
    });
  const sending = sendMessage.isPending;
  return { attachments, canSend, error, onAttach, onSend, sending, setError, setText, text, sentVersion };
}

async function sendChatMessage(
  canSend: boolean,
  mutation: ReturnType<typeof useSendChatMessageMutation>,
  state: {
    attachments: AttachmentDraft[];
    onSent: () => void;
    setAttachments: (value: AttachmentDraft[]) => void;
    setError: (value: string) => void;
    setText: (value: string) => void;
    t: (key: string) => string;
    text: string;
  },
): Promise<void> {
  if (!canSend) {
    return;
  }
  try {
    await mutation.mutateAsync({ attachments: state.attachments, text: state.text });
    state.setText('');
    state.setAttachments([]);
    state.setError('');
    state.onSent();
  } catch {
    state.setError(state.t('coach.chat.error'));
  }
}

function canSendMessage(text: string, attachments: AttachmentDraft[], threadId: string): boolean {
  const hasText = text.trim().length > 0;
  return (hasText || attachments.length > 0) && threadId.length > 0;
}

type ChatModel = ReturnType<typeof useChatViewModel>;
type ViewModel = ChatModel & ReturnType<typeof useMessageComposer>;

function ChatView(props: ChatModel) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <ChatHeader
        subtitle={props.t('coach.chat.subtitle')}
        title={props.t('coach.chat.title')}
        retentionTitle={props.t('coach.chat.retention.title')}
        retentionSubtitle={props.t('coach.chat.retention.subtitle')}
      />
      {renderClientStrip(props)}
      <ChatConversationContainer key={props.threadId} {...props} />
    </ScrollView>
  );
}

function ChatConversationContainer(props: ChatModel): React.JSX.Element {
  const composer = useMessageComposer(props.threadId, props.t);
  return <ChatConversation {...props} {...composer} />;
}
function ChatConversation(props: ViewModel): React.JSX.Element {
  const selectedClient = props.clientItems.find((client) => client.id === props.clientId);
  const initials = selectedClient?.title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <View style={styles.conversationFrame}>
      <View style={styles.conversationHeader}>
        <View style={styles.conversationAvatar}>
          <Text style={styles.conversationInitials}>{initials || '·'}</Text>
        </View>
        <Text numberOfLines={1} style={styles.conversationName}>
          {selectedClient?.title ?? props.t('coach.chat.title')}
        </Text>
      </View>
      <ChatMessagesPanel {...props} />
      <ChatComposer {...props} />
    </View>
  );
}

function ChatHeader(props: { retentionSubtitle: string; retentionTitle: string; subtitle: string; title: string }) {
  return (
    <>
      <Text style={styles.title}>{props.title}</Text>
      <Text style={styles.subtitle}>{props.subtitle}</Text>
      <Banner subtitle={props.retentionSubtitle} title={props.retentionTitle} />
    </>
  );
}

function ChatComposer(props: ViewModel) {
  return (
    <View style={styles.inputPanel}>
      <TextField multiline onChangeText={props.setText} placeholder={props.t('coach.chat.placeholder')} value={props.text} />
      <AttachmentsPicker onAttach={props.onAttach} onError={props.setError} threadId={props.threadId} />
      {props.attachments.map((item) => (
        <Text key={item.storagePath} style={styles.draft}>
          {item.fileName}
        </Text>
      ))}
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
      <Button label={props.t('coach.chat.send')} loading={props.sending} onPress={props.onSend} />
    </View>
  );
}

function renderClientStrip(props: ChatModel): React.JSX.Element {
  const status = QueryResult({
    emptyTitle: props.t('coach.clients.empty'),
    skeleton: 'rows',
    error: props.clientsQuery.error,
    isError: props.clientsQuery.isError,
    isLoading: props.clientsQuery.isLoading,
    itemCount: props.clientItems.length,
    onRetry: () => void props.clientsQuery.refetch(),
  });
  if (status) {
    return status;
  }
  return <ClientCardRow items={props.clientItems} onItemPress={props.setClientId} selectedId={props.clientId} />;
}

function ChatMessagesPanel(props: ViewModel): React.JSX.Element | null {
  const messages = props.messagesQuery.data ?? [];

  if (props.clientsQuery.isLoading || props.clientsQuery.isError || props.clientItems.length === 0) {
    return null;
  }
  const waitingForThread = props.clientId.length > 0 && props.threadId.length === 0 && !props.threadQuery.isError;
  const status = QueryResult({
    emptyTitle: props.t('coach.chat.empty'),
    skeleton: 'rows',
    error: props.threadQuery.error ?? props.messagesQuery.error,
    isError: props.threadQuery.isError || props.messagesQuery.isError,
    isLoading: props.threadQuery.isLoading || props.messagesQuery.isLoading || waitingForThread,
    itemCount: messages.length || (!props.messagesQuery.isLoading && !props.messagesQuery.isError ? 1 : 0),
    onRetry: () => {
      void props.threadQuery.refetch();
      void props.messagesQuery.refetch();
    },
  });
  if (status) {
    return status;
  }
  return <ChatHistoryPanel key={props.threadId} query={props.messagesQuery} sentVersion={props.sentVersion} t={props.t} />;
}

const styles = StyleSheet.create({
  draft: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  conversationAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  conversationFrame: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  conversationHeader: {
    alignItems: 'center',
    backgroundColor: colors.chartTeal,
    flexDirection: 'row',
    gap: space.md,
    minHeight: 64,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  conversationInitials: {
    color: colors.chartTeal,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  conversationName: {
    color: colors.onPrimary,
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  inputPanel: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: space.sm,
    padding: space.md,
    width: '100%',
  },
  messages: {
    flexGrow: 1,
    gap: space.sm,
    justifyContent: 'flex-end',
    padding: space.md,
    width: '100%',
  },
  messagesViewport: {
    backgroundColor: colors.background,
    height: 420,
    maxHeight: 520,
    minHeight: 260,
    width: '100%',
  },
  page: {
    backgroundColor: colors.background,
    gap: space.md,
    minHeight: '100%',
    padding: space.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
});
