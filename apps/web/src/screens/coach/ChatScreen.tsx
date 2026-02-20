import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Banner } from '@trainerpro/ui';
import '../../i18n';
import { useClientsQuery } from '../../data/hooks/useClientsQuery';
import {
  useChatMessagesQuery,
  useCoachThreadQuery,
  useSendChatMessageMutation,
} from '../../data/hooks/useChat';
import {
  AttachmentsPicker,
  type AttachmentDraft,
} from '../../features/chat/AttachmentsPicker';
import { ClientSelectionStrip } from './components/ClientSelectionStrip';
import { ChatMessageBubble } from './components/ChatMessageBubble';

export function ChatScreen(): React.JSX.Element {
  const vm = useChatViewModel();
  return <ChatView {...vm} />;
}

function useChatViewModel() {
  const { t } = useTranslation();
  const clientsQuery = useClientsQuery();
  const [clientId, setClientId] = useState('');
  useDefaultClient(clientId, clientsQuery.data, setClientId);
  const threadId = useThreadId(clientId);
  const messagesQuery = useChatMessagesQuery(threadId);
  const clientItems = useMemo(() => toClientCards(clientsQuery.data ?? []), [clientsQuery.data]);
  const composer = useMessageComposer(threadId, t);
  return {
    ...composer,
    clientId,
    clientItems,
    clientsQuery,
    messagesQuery,
    setClientId,
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

function useThreadId(clientId: string): string {
  const threadQuery = useCoachThreadQuery(clientId);
  return threadQuery.data?.id ?? '';
}

function useMessageComposer(threadId: string, t: (key: string) => string) {
  const sendMessage = useSendChatMessageMutation(threadId);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const canSend = useMemo(
    () => canSendMessage(text, attachments, threadId),
    [attachments, text, threadId],
  );
  const onAttach = (attachment: AttachmentDraft) =>
    setAttachments((current) => [...current, attachment]);
  const onSend = () =>
    sendChatMessage(canSend, sendMessage, {
      attachments,
      setAttachments,
      setError,
      setText,
      t,
      text,
    });
  return { canSend, error, onAttach, onSend, setError, setText, text };
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
      <ClientSelectionStrip
        emptyLabel={props.t('coach.clients.empty')}
        items={props.clientItems}
        loading={props.clientsQuery.isLoading}
        onSelect={props.setClientId}
        selectedId={props.clientId}
        showArrows
      />
      {renderMessagesPanel(props.messagesQuery, props.clientsQuery.isLoading, props.t)}
      <ChatComposer {...props} />
    </ScrollView>
  );
}

function ChatHeader(props: {
  retentionSubtitle: string;
  retentionTitle: string;
  subtitle: string;
  title: string;
}) {
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
      <TextInput
        multiline
        onChangeText={props.setText}
        placeholder={props.t('coach.chat.placeholder')}
        style={styles.textInput}
        value={props.text}
      />
      <AttachmentsPicker
        onAttach={props.onAttach}
        onError={props.setError}
        threadId={props.threadId}
      />
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
      <Pressable onPress={props.onSend} style={styles.sendButton}>
        <Text style={styles.sendLabel}>{props.t('coach.chat.send')}</Text>
      </Pressable>
    </View>
  );
}

function renderMessagesPanel(
  messagesQuery: {
    data?: ReturnType<typeof useChatMessagesQuery>['data'];
    isLoading: boolean;
  },
  clientsLoading: boolean,
  t: (key: string) => string,
) {
  if (clientsLoading || messagesQuery.isLoading) {
    return <ActivityIndicator />;
  }
  const messages = messagesQuery.data ?? [];
  if (messages.length === 0) {
    return <Text style={styles.empty}>{t('coach.chat.empty')}</Text>;
  }
  return (
    <View style={styles.messages}>
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
    </View>
  );
}

function toClientCards(
  clients: Array<{
    avatarUrl: null | string;
    email: string;
    firstName: string;
    id: string;
    lastName: string;
  }>,
) {
  return clients.map((client) => ({
    avatarUrl: client.avatarUrl,
    email: client.email,
    id: client.id,
    name: `${client.firstName} ${client.lastName}`.trim(),
  }));
}

const styles = StyleSheet.create({
  empty: {
    color: '#5d6f85',
    fontSize: 13,
  },
  error: {
    color: '#b32323',
    fontSize: 12,
    fontWeight: '700',
  },
  inputPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe3ef',
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 12,
    width: '100%',
  },
  messages: {
    backgroundColor: '#f7f9fc',
    borderColor: '#dbe3ef',
    borderRadius: 14,
    borderWidth: 1,
    gap: 9,
    minHeight: 260,
    padding: 12,
    width: '100%',
  },
  page: {
    backgroundColor: '#eef3f9',
    gap: 12,
    minHeight: '100%',
    padding: 18,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#1c74e9',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 42,
  },
  sendLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  subtitle: {
    color: '#5d6f85',
    fontSize: 14,
  },
  textInput: {
    borderColor: '#d8e1ee',
    borderRadius: 10,
    borderWidth: 1,
    color: '#12263f',
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  title: {
    color: '#0f2036',
    fontSize: 28,
    fontWeight: '800',
  },
});
