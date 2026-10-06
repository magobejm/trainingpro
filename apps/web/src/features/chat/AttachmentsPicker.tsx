import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import '../../i18n';
import { postChatUpload } from '../../data/hooks/useChat';
import { useAuthStore } from '../../store/auth.store';
import { acceptChatFile, CHAT_ATTACHMENT_ACCEPT } from './chat-attachment.utils';

export type AttachmentDraft = {
  fileName: string;
  kind: 'AUDIO' | 'IMAGE' | 'PDF';
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
};

type Props = {
  onAttach: (attachment: AttachmentDraft) => void;
  onError: (message: string) => void;
  threadId: string;
};

export function AttachmentsPicker(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const canAttach = props.threadId.length > 0 && !pending && Boolean(accessToken && activeRole);
  const onPress = () => {
    if (!canAttach || !accessToken || !activeRole) {
      return;
    }
    void uploadSelectedFile(props, { accessToken, activeRole, setPending, t });
  };
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{t('coach.chat.attachments.title')}</Text>
      <Pressable disabled={!canAttach} onPress={onPress} style={styles.button}>
        <Text style={styles.buttonLabel}>{t('coach.chat.attachments.add')}</Text>
      </Pressable>
    </View>
  );
}

async function uploadSelectedFile(
  props: Props,
  args: {
    accessToken: string;
    activeRole: 'admin' | 'coach' | 'client';
    setPending: (pending: boolean) => void;
    t: (key: string) => string;
  },
): Promise<void> {
  const file = await pickWebFile();
  if (!file) {
    return;
  }
  const accepted = acceptChatFile({ mimeType: file.type, name: file.name, sizeBytes: file.size });
  if (!accepted) {
    props.onError(args.t('coach.chat.attachments.error'));
    return;
  }
  args.setPending(true);
  try {
    const form = new FormData();
    form.append('file', file);
    form.append('threadId', props.threadId);
    const uploaded = await postChatUpload(
      { accessToken: args.accessToken, activeRole: args.activeRole },
      props.threadId,
      form,
    );
    props.onError('');
    props.onAttach(uploaded);
  } catch {
    props.onError(args.t('coach.chat.attachments.error'));
  } finally {
    args.setPending(false);
  }
}

function pickWebFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = CHAT_ATTACHMENT_ACCEPT;
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(file);
    };
    input.addEventListener('change', () => {
      finish(input.files?.[0] ?? null);
    });
    window.addEventListener(
      'focus',
      () => {
        window.setTimeout(() => finish(null), 500);
      },
      { once: true },
    );
    input.click();
  });
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#1c74e9',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 40,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  label: {
    color: '#4a607f',
    fontSize: 12,
    fontWeight: '700',
  },
  root: {
    gap: 8,
  },
});
