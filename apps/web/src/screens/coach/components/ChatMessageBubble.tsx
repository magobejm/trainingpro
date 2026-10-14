import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '../../../data/hooks/useChat';
import { CallProposalCard } from './CallProposalCard';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

export function ChatMessageBubble(props: { message: ChatMessage }): React.JSX.Element {
  if (props.message.callProposal && !props.message.text) {
    return <CallProposalCard proposal={props.message.callProposal} />;
  }
  const isCoach = props.message.senderRole === 'COACH';
  return (
    <View style={[styles.bubble, isCoach ? styles.bubbleCoach : styles.bubbleClient]}>
      {props.message.text ? <Text style={styles.bubbleText}>{props.message.text}</Text> : null}
      {props.message.attachments.map((attachment) => (
        <AttachmentItem attachment={attachment} key={attachment.storagePath} />
      ))}
    </View>
  );
}

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

const styles = StyleSheet.create({
  attachmentImage: {
    borderRadius: radius.md,
    height: 140,
    marginTop: space.sm,
    width: 180,
  },
  attachmentItem: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  attachmentLink: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  bubble: {
    borderRadius: 16,
    maxWidth: '78%',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  bubbleClient: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  bubbleCoach: {
    alignSelf: 'flex-end',
    backgroundColor: colors.successSoft,
  },
  bubbleText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
});
