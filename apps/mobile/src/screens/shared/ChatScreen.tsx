import React, { useMemo, useState } from 'react';
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
import {
  useChatMessagesQuery,
  useClientThreadQuery,
  useSendChatMessageMutation,
  type ChatMessage,
} from '../../data/hooks/useChat';
import {
  AttachmentsPicker,
  type AttachmentDraft,
} from '../../features/chat/AttachmentsPicker';

export function ChatScreen(): React.JSX.Element {
  const vm = useChatViewModel();
  return <ChatView {...vm} />;
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
  if (!canSend) {
    return;
  }
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

type ViewModel = ReturnType<typeof useChatViewModel>;

function ChatView(props: ViewModel) {
  if (props.threadId && props.messagesQuery.isLoading) {
    return <ActivityIndicator />;
  }
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <ChatHeader
        retentionTitle={props.t('client.chat.retention.title')}
        subtitle={props.t('client.chat.retention.subtitle')}
        title={props.t('client.chat.title')}
      />
      <View style={styles.messages}>{renderMessages(props.messagesQuery.data ?? [], props.t)}</View>
      <ChatComposer {...props} />
    </ScrollView>
  );
}

function ChatHeader(props: { retentionTitle: string; subtitle: string; title: string }) {
  return (
    <>
      <Text style={styles.title}>{props.title}</Text>
      <Banner subtitle={props.subtitle} title={props.retentionTitle} />
    </>
  );
}

function ChatComposer(props: ViewModel) {
  return (
    <View style={styles.inputPanel}>
      <TextInput
        multiline
        onChangeText={props.setText}
        placeholder={props.t('client.chat.placeholder')}
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
  attachmentItem: {
    color: '#2e4772',
    fontSize: 11,
    fontWeight: '600',
  },
  bubble: {
    borderRadius: 12,
    maxWidth: '80%',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bubbleClient: {
    alignSelf: 'flex-end',
    backgroundColor: '#dce8ff',
  },
  bubbleCoach: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#d8e2f0',
    borderWidth: 1,
  },
  bubbleText: {
    color: '#10233c',
    fontSize: 13,
  },
  empty: {
    color: '#5c6f8a',
    fontSize: 13,
  },
  error: {
    color: '#b32323',
    fontSize: 12,
    fontWeight: '700',
  },
  inputPanel: {
    backgroundColor: '#ffffff',
    borderColor: '#d9e3f1',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10,
    width: '100%',
  },
  messages: {
    gap: 8,
    width: '100%',
  },
  page: {
    backgroundColor: '#edf2fa',
    gap: 10,
    minHeight: '100%',
    padding: 14,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#1c74e9',
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  sendLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  textInput: {
    borderColor: '#d7e1ee',
    borderRadius: 10,
    borderWidth: 1,
    color: '#10233c',
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  title: {
    color: '#0e223c',
    fontSize: 24,
    fontWeight: '800',
  },
});
