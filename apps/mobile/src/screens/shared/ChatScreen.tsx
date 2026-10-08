import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Banner } from '@trainerpro/ui';
import '../../i18n';
import {
  useChatMessagesQuery,
  useClientThreadQuery,
  useAcceptCallProposalMutation,
  useCounterCallProposalMutation,
  useSendChatMessageMutation,
  type ChatMessage,
} from '../../data/hooks/useChat';
import { CALL_COLOR, CALL_REQUEST_COLOR, callTimeOptions } from '../client/calendar-fixed-colors';
import { AttachmentsPicker, type AttachmentDraft } from '../../features/chat/AttachmentsPicker';
import { LIGHT } from '../../theme/light';

type ChatScreenProps = {
  embedded?: boolean;
  initialMessage?: string;
};

export function ChatScreen(props: ChatScreenProps): React.JSX.Element {
  const vm = useChatViewModel(props.initialMessage);
  return <ChatView embedded={props.embedded} {...vm} />;
}

function useChatViewModel(initialMessage?: string) {
  const { t } = useTranslation();
  const threadId = useThreadId();
  const messagesQuery = useChatMessagesQuery(threadId);
  const composer = useMessageComposer(threadId, t, initialMessage);
  return { ...composer, messagesQuery, t, threadId };
}

function useThreadId(): string {
  const threadQuery = useClientThreadQuery();
  return threadQuery.data?.id ?? '';
}

function useMessageComposer(threadId: string, t: (key: string) => string, initialMessage?: string) {
  const sendMessage = useSendChatMessageMutation(threadId);
  const [text, setText] = useState(initialMessage ?? '');
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  useEffect(() => {
    if (initialMessage) setText(initialMessage);
  }, [initialMessage]);
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
      {props.attachments.map((item) => (
        <Text key={item.storagePath} style={styles.draft}>
          {item.fileName}
        </Text>
      ))}
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
  if (props.message.callProposal && !props.message.text) {
    return <CallProposalCard proposal={props.message.callProposal} />;
  }
  const isClient = props.message.senderRole === 'CLIENT';
  return (
    <View style={[styles.bubble, isClient ? styles.bubbleClient : styles.bubbleCoach]}>
      {props.message.text ? <Text style={styles.bubbleText}>{props.message.text}</Text> : null}
      {props.message.attachments.map((attachment) => (
        <AttachmentItem attachment={attachment} key={attachment.storagePath} />
      ))}
    </View>
  );
}

function CallProposalCard(props: { proposal: NonNullable<ChatMessage['callProposal']> }): React.JSX.Element {
  const { t } = useTranslation();
  const proposal = props.proposal;
  const tone = proposal.initiatedBy === 'CLIENT' ? CALL_REQUEST_COLOR : CALL_COLOR;
  const canRespond = proposal.status === 'pending' && proposal.lastProposedBy !== 'CLIENT';
  const accepted = proposal.status === 'accepted';
  const [countering, setCountering] = useState(false);
  const [time, setTime] = useState(proposal.proposedTime);
  const accept = useAcceptCallProposalMutation();
  const counter = useCounterCallProposalMutation();
  return (
    <View style={[styles.callCard, { backgroundColor: tone }]}>
      <Text style={styles.callTitle}>
        {t(accepted ? 'client.chat.call.confirmedTitle' : 'client.chat.call.requestTitle')}
      </Text>
      <Text style={styles.callText}>{t('client.chat.call.date', { date: proposal.date })}</Text>
      <Text style={styles.callText}>
        {t(accepted ? 'client.chat.call.confirmedTime' : 'client.chat.call.proposedTime', { time: proposal.proposedTime })}
      </Text>
      <Text style={styles.callText}>
        {t('client.chat.call.lastProposedBy', {
          who: t(proposal.lastProposedBy === 'COACH' ? 'client.chat.call.coach' : 'client.chat.call.client'),
        })}
      </Text>
      {canRespond ? <CallButton label={t('client.chat.call.accept')} onPress={() => accept.mutate(proposal.id)} /> : null}
      {canRespond && !countering ? (
        <CallButton label={t('client.chat.call.counter')} onPress={() => setCountering(true)} />
      ) : null}
      {countering ? (
        <View>
          <select onChange={(event) => setTime(event.target.value)} style={callSelectStyle} value={time}>
            {callTimeOptions().map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <CallButton
            label={t('client.chat.call.sendCounter')}
            onPress={() => counter.mutate({ proposalId: proposal.id, time }, { onSuccess: () => setCountering(false) })}
          />
        </View>
      ) : null}
    </View>
  );
}

function CallButton(props: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={styles.callButton}>
      <Text style={styles.callButtonText}>{props.label}</Text>
    </Pressable>
  );
}

const callSelectStyle = { borderRadius: 8, marginTop: 8, padding: 6 } as const;

function AttachmentItem(props: { attachment: ChatMessage['attachments'][number] }): React.JSX.Element {
  const url = props.attachment.publicUrl;
  if (!url) {
    return <Text style={styles.attachmentItem}>{props.attachment.fileName}</Text>;
  }
  if (props.attachment.kind === 'IMAGE') {
    return (
      <Pressable onPress={() => openAttachment(url)}>
        <Image source={{ uri: url }} style={styles.attachmentImage} />
        <Text style={styles.attachmentLink}>{props.attachment.fileName}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={() => openAttachment(url)}>
      <Text style={styles.attachmentLink}>{props.attachment.fileName}</Text>
    </Pressable>
  );
}

function openAttachment(url: string): void {
  void Linking.openURL(url);
}

const CALL_TEXT = '#f8fafc';

const styles = StyleSheet.create({
  callButton: { backgroundColor: '#ffffff22', borderRadius: 10, marginTop: 8, paddingVertical: 8 },
  callButtonText: { color: CALL_TEXT, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  callCard: { alignSelf: 'stretch', borderRadius: 14, marginVertical: 4, padding: 12 },
  callText: { color: CALL_TEXT, fontSize: 12, marginTop: 2 },
  callTitle: { color: CALL_TEXT, fontSize: 13, fontWeight: '700' },
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
  attachmentImage: { borderRadius: 8, height: 140, marginTop: 6, width: 180 },
  attachmentItem: { color: LIGHT.textMuted, fontSize: 11, fontWeight: '600' },
  attachmentLink: { color: LIGHT.accent, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  draft: { color: LIGHT.accent, fontSize: 12, fontWeight: '700' },
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
