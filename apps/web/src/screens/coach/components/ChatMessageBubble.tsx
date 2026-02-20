import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '../../../data/hooks/useChat';

export function ChatMessageBubble(props: { message: ChatMessage }): React.JSX.Element {
  const isCoach = props.message.senderRole === 'COACH';
  return (
    <View style={[styles.bubble, isCoach ? styles.bubbleCoach : styles.bubbleClient]}>
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
    color: '#475f85',
    fontSize: 11,
    fontWeight: '600',
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
