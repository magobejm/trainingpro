import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '../../../data/hooks/useChat';
import { CallProposalCard } from './CallProposalCard';

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
    borderRadius: 8,
    height: 140,
    marginTop: 6,
    width: 180,
  },
  attachmentItem: {
    color: '#475f85',
    fontSize: 11,
    fontWeight: '600',
  },
  attachmentLink: {
    color: '#1c74e9',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  bubble: {
    borderRadius: 16,
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleClient: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#dce5f2',
    borderWidth: 1,
  },
  bubbleCoach: {
    alignSelf: 'flex-end',
    backgroundColor: '#dbe8ff',
  },
  bubbleText: {
    color: '#111d30',
    fontSize: 13,
  },
});
