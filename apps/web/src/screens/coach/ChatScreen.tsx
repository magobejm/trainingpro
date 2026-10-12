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
import { ChatMessageBubble } from './components/ChatMessageBubble';

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
  const composer = useMessageComposer(threadId, t);
  return {
    ...composer,
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
  const sending = sendMessage.isPending;
  return { attachments, canSend, error, onAttach, onSend, sending, setError, setText, text };
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
  if (!canSend) {
    return;
  }
  try {
    await mutation.mutateAsync({ attachments: state.attachments, text: state.text });
    state.setText('');
    state.setAttachments([]);
    state.setError('');
  } catch {
    state.setError(state.t('coach.chat.error'));
  }
}

function canSendMessage(text: string, attachments: AttachmentDraft[], threadId: string): boolean {
  const hasText = text.trim().length > 0;
  return (hasText || attachments.length > 0) && threadId.length > 0;
}

type ViewModel = ReturnType<typeof useChatViewModel>;

function ChatView(props: ViewModel) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <ChatHeader
        subtitle={props.t('coach.chat.subtitle')}
        title={props.t('coach.chat.title')}
        retentionTitle={props.t('coach.chat.retention.title')}
        retentionSubtitle={props.t('coach.chat.retention.subtitle')}
      />
      {renderClientStrip(props)}
      {renderMessagesPanel(props)}
      <ChatComposer {...props} />
    </ScrollView>
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

function renderClientStrip(props: ViewModel): React.JSX.Element {
  const status = QueryResult({
    emptyTitle: props.t('coach.clients.empty'),
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

function renderMessagesPanel(props: ViewModel): React.JSX.Element | null {
  if (props.clientsQuery.isLoading || props.clientsQuery.isError || props.clientItems.length === 0) {
    return null;
  }
  const messages = props.messagesQuery.data ?? [];
  const waitingForThread = props.clientId.length > 0 && props.threadId.length === 0 && !props.threadQuery.isError;
  const status = QueryResult({
    emptyTitle: props.t('coach.chat.empty'),
    error: props.threadQuery.error ?? props.messagesQuery.error,
    isError: props.threadQuery.isError || props.messagesQuery.isError,
    isLoading: props.threadQuery.isLoading || props.messagesQuery.isLoading || waitingForThread,
    itemCount: messages.length,
    onRetry: () => {
      void props.threadQuery.refetch();
      void props.messagesQuery.refetch();
    },
  });
  if (status) {
    return status;
  }
  return (
    <View style={styles.messages}>
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  draft: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  inputPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
    width: '100%',
  },
  messages: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space.sm,
    minHeight: 260,
    padding: space.md,
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
