import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Banner } from '@trainerpro/ui';
import '../../i18n';
import {
  useChatMessagesQuery,
  useThreadQuery,
  useAcceptCallProposalMutation,
  useCounterCallProposalMutation,
  useSendChatMessageMutation,
  type ChatMessage,
} from '../../data/hooks/useChat';
import { CALL_COLOR, CALL_REQUEST_COLOR } from '../client/calendar-fixed-colors';
import { CallTimeSelect } from '../client/CallTimeSelect';
import { AttachmentsPicker, type AttachmentDraft } from '../../features/chat/AttachmentsPicker';
import { TechniqueAnalysisButton } from '../../features/chat/TechniqueAnalysisButton';
import { VideoAttachment } from '../../features/chat/VideoAttachment';
import { extractExerciseName } from '../client/exercise-comment.utils';
import { LIGHT } from '../../theme/light';
import { useAuthStore } from '../../store/auth.store';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import { canRespondToCall, isOwnChatMessage } from '../coach/coach-client-model';
import { useCoachCopy } from '../coach/coach-copy';
import { ChatHistoryList } from './ChatHistoryList';

type ChatScreenProps = {
  clientId?: string;
  embedded?: boolean;
  initialMessage?: string;
  interlocutorName?: string;
};

export function ChatScreen(props: ChatScreenProps): React.JSX.Element {
  const threadQuery = useThreadQuery(props.clientId);
  const role = useAuthStore((state) => state.activeRole);
  const c = useCoachCopy();
  if (role === 'coach' && !props.clientId)
    return (
      <View style={styles.page}>
        <Text style={styles.title}>{c('noClient')}</Text>
      </View>
    );
  const threadId = threadQuery.data?.id;
  if (!threadId) return <ThreadStatus embedded={props.embedded} query={threadQuery} />;
  return <ConversationChat key={threadId} {...props} threadId={threadId} />;
}

function ConversationChat(props: ChatScreenProps & { threadId: string }): React.JSX.Element {
  const vm = useChatViewModel(props.threadId, props.initialMessage);
  return <ChatView embedded={props.embedded} interlocutorName={props.interlocutorName} {...vm} />;
}

function useChatViewModel(threadId: string, initialMessage?: string) {
  const { t } = useTranslation();
  const messagesQuery = useChatMessagesQuery(threadId);
  const composer = useMessageComposer(threadId, t, initialMessage);
  return { ...composer, messagesQuery, t, threadId };
}

function ThreadStatus(props: { embedded?: boolean; query: ReturnType<typeof useThreadQuery> }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.page, props.embedded && styles.pageEmbedded]}>
      {props.query.isError ? (
        <View>
          <Text style={styles.error}>{t('chat.history.refreshError')}</Text>
          <Pressable accessibilityRole={'button'} onPress={() => void props.query.refetch()}>
            <Text style={styles.error}>{t('chat.history.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <ActivityIndicator color={LIGHT.accent} />
      )}
    </View>
  );
}

function useMessageComposer(threadId: string, t: (key: string) => string, initialMessage?: string) {
  const sendMessage = useSendChatMessageMutation(threadId);
  const draft = useCoachDraft<{ text: string; attachments: AttachmentDraft[] }>('chat:' + threadId, {
    text: '',
    attachments: [],
  });
  const text = draft.value.text;
  const setText = (value: string) => draft.setValue((current) => ({ ...current, text: value }));
  const attachments = draft.value.attachments;
  const setAttachments = (value: AttachmentDraft[] | ((current: AttachmentDraft[]) => AttachmentDraft[])) =>
    draft.setValue((current) => ({
      ...current,
      attachments: typeof value === 'function' ? value(current.attachments) : value,
    }));
  const [error, setError] = useState('');
  const [sentVersion, setSentVersion] = useState(0);
  const seededMessage = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!draft.ready || !initialMessage || seededMessage.current === initialMessage) return;
    seededMessage.current = initialMessage;
    if (!text.trim()) setText(initialMessage);
  }, [initialMessage, draft.ready]);
  const canSend = useMemo(
    () => canSendMessage(text, attachments, threadId) && draft.ready && !sendMessage.isPending,
    [attachments, text, threadId, draft.ready, sendMessage.isPending],
  );
  const onAttach = (attachment: AttachmentDraft) => setAttachments((current) => [...current, attachment]);
  const onSend = () =>
    sendChatMessage(canSend, sendMessage, {
      attachments,
      clearDraft: () => draft.clear(),
      setError,
      onSent: () => setSentVersion((version) => version + 1),
      t,
      text,
    });
  return { attachments, canSend, error, onAttach, onSend, sentVersion, setError, setText, text };
}

async function sendChatMessage(
  canSend: boolean,
  mutation: ReturnType<typeof useSendChatMessageMutation>,
  state: {
    attachments: AttachmentDraft[];
    clearDraft: () => Promise<void>;
    setError: (value: string) => void;
    t: (key: string) => string;
    text: string;
    onSent: () => void;
  },
): Promise<void> {
  if (!canSend) return;
  try {
    await mutation.mutateAsync({ attachments: state.attachments, text: state.text });
    state.setError('');
    state.onSent();
    await state.clearDraft();
  } catch {
    state.setError(state.t('client.chat.error'));
  }
}

function canSendMessage(text: string, attachments: AttachmentDraft[], threadId: string): boolean {
  const hasText = text.trim().length > 0;
  return (hasText || attachments.length > 0) && threadId.length > 0;
}

type ViewModel = ReturnType<typeof useChatViewModel> & { embedded?: boolean; interlocutorName?: string };

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
            <Text style={styles.embeddedCoachName}>{props.interlocutorName ?? props.t('mobile.client.chat.coach')}</Text>
            <Text style={styles.embeddedOnline}>{props.t('mobile.client.chat.online')}</Text>
          </View>
        </View>
      ) : (
        <ChatHeader
          retentionTitle={props.t('client.chat.retention.title')}
          subtitle={props.t('client.chat.retention.subtitle')}
          title={props.interlocutorName ?? props.t('client.chat.title')}
        />
      )}
      <ChatHistoryList
        query={props.messagesQuery}
        renderMessage={(message) => <MessageBubble message={message} />}
        sentVersion={props.sentVersion}
      />
      <ChatComposer {...props} embedded={props.embedded} />
    </>
  );

  if (props.embedded) {
    return <View style={[styles.page, styles.pageEmbedded]}>{content}</View>;
  }
  return <View style={styles.page}>{content}</View>;
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
      <Pressable
        accessibilityRole="button"
        disabled={!props.canSend}
        onPress={props.onSend}
        style={[styles.sendButton, !props.canSend && styles.disabled]}
      >
        <Text style={styles.sendLabel}>{props.t('client.chat.send')}</Text>
      </Pressable>
    </View>
  );
}

function MessageBubble(props: { message: ChatMessage }) {
  const role = useAuthStore((state) => state.activeRole);
  if (props.message.callProposal && !props.message.text) {
    return <CallProposalCard proposal={props.message.callProposal} />;
  }
  const isClient = isOwnChatMessage(role, props.message.senderRole);
  return (
    <View style={[styles.bubble, isClient ? styles.bubbleClient : styles.bubbleCoach]}>
      {props.message.text ? <Text style={styles.bubbleText}>{props.message.text}</Text> : null}
      {props.message.attachments.map((attachment) => (
        <AttachmentItem attachment={attachment} key={attachment.storagePath} messageText={props.message.text} />
      ))}
    </View>
  );
}

function CallProposalCard(props: { proposal: NonNullable<ChatMessage['callProposal']> }): React.JSX.Element {
  const { t } = useTranslation();
  const proposal = props.proposal;
  const tone = proposal.initiatedBy === 'CLIENT' ? CALL_REQUEST_COLOR : CALL_COLOR;
  const role = useAuthStore((state) => state.activeRole);
  const canRespond = canRespondToCall(role, proposal);
  const accepted = proposal.status === 'accepted';
  const cancelled = proposal.status === 'cancelled';
  const [countering, setCountering] = useState(false);
  const [time, setTime] = useState(proposal.proposedTime);
  const accept = useAcceptCallProposalMutation();
  const counter = useCounterCallProposalMutation();
  return (
    <View style={[styles.callCard, { backgroundColor: tone }]}>
      <Text style={styles.callTitle}>
        {t(
          cancelled
            ? 'client.chat.call.cancelledTitle'
            : accepted
              ? 'client.chat.call.confirmedTitle'
              : 'client.chat.call.requestTitle',
        )}
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
      {canRespond ? (
        <CallButton
          disabled={accept.isPending || counter.isPending}
          label={t('client.chat.call.accept')}
          onPress={() => accept.mutate(proposal.id)}
        />
      ) : null}
      {canRespond && !countering ? (
        <CallButton
          disabled={accept.isPending || counter.isPending}
          label={t('client.chat.call.counter')}
          onPress={() => setCountering(true)}
        />
      ) : null}
      {countering && canRespond ? (
        <View>
          <CallTimeSelect onChange={setTime} value={time} />
          <CallButton
            disabled={accept.isPending || counter.isPending}
            label={t('client.chat.call.sendCounter')}
            onPress={() => counter.mutate({ proposalId: proposal.id, time }, { onSuccess: () => setCountering(false) })}
          />
        </View>
      ) : null}
    </View>
  );
}

function CallButton(props: { label: string; onPress: () => void; disabled?: boolean }): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={props.disabled}
      onPress={props.onPress}
      style={[styles.callButton, props.disabled && styles.disabled]}
    >
      <Text style={styles.callButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function AttachmentItem(props: {
  attachment: ChatMessage['attachments'][number];
  messageText?: null | string;
}): React.JSX.Element {
  const url = props.attachment.publicUrl;
  if (!url) {
    return <Text style={styles.attachmentItem}>{props.attachment.fileName}</Text>;
  }
  if (props.attachment.kind === 'VIDEO') {
    return (
      <View>
        <VideoAttachment uri={url} />
        <Text style={styles.attachmentLink}>{props.attachment.fileName}</Text>
        <TechniqueAnalysisButton attachmentId={props.attachment.id} exerciseName={extractExerciseName(props.messageText)} />
      </View>
    );
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
  disabled: { opacity: 0.5 },
  callButton: { backgroundColor: '#ffffff22', borderRadius: 10, marginTop: 8, paddingVertical: 8 },
  callButtonText: { color: CALL_TEXT, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  callCard: { alignSelf: 'stretch', borderRadius: 14, marginVertical: 4, padding: 12 },
  callText: { color: CALL_TEXT, fontSize: 12, marginTop: 2 },
  callTitle: { color: CALL_TEXT, fontSize: 13, fontWeight: '700' },
  page: {
    backgroundColor: LIGHT.bgSoft,
    gap: 10,
    flex: 1,
    minHeight: 0,
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
  sendButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: LIGHT.emeraldBg,
    borderRadius: LIGHT.radiusFull,
    height: 44,
    justifyContent: 'center',
    minWidth: 80,
    paddingHorizontal: 12,
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
