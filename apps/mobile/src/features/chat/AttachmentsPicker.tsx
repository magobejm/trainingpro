import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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

type SelectedFile = {
  append: (form: FormData) => void;
  mimeType: string;
  name: string;
  sizeBytes: number | null;
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
      <Text style={styles.label}>{t('client.chat.attachments.title')}</Text>
      <Pressable disabled={!canAttach} onPress={onPress} style={styles.attachButton}>
        <Text style={styles.attachLabel}>{t('client.chat.attachments.add')}</Text>
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
  const file = await chooseFile();
  if (!file) {
    return;
  }
  const accepted = acceptChatFile(file);
  if (!accepted) {
    props.onError(args.t('client.chat.attachments.error'));
    return;
  }
  args.setPending(true);
  try {
    const form = new FormData();
    file.append(form);
    form.append('threadId', props.threadId);
    const uploaded = await postChatUpload(
      { accessToken: args.accessToken, activeRole: args.activeRole },
      props.threadId,
      form,
    );
    props.onError('');
    props.onAttach(uploaded);
  } catch {
    props.onError(args.t('client.chat.attachments.error'));
  } finally {
    args.setPending(false);
  }
}

async function chooseFile(): Promise<SelectedFile | null> {
  if (Platform.OS === 'web') {
    return pickWebFile();
  }
  return pickNativeFile();
}

function pickWebFile(): Promise<SelectedFile | null> {
  const scope = globalThis as {
    document?: {
      createElement: (tag: 'input') => {
        accept: string;
        addEventListener: (event: 'change', listener: () => void) => void;
        click: () => void;
        files: ArrayLike<Blob & { name: string; size: number; type: string }> | null;
        type: string;
      };
    };
    window?: {
      addEventListener: (event: 'focus', listener: () => void, options: { once: true }) => void;
      setTimeout: (listener: () => void, delay: number) => void;
    };
  };
  const webDocument = scope.document;
  const webWindow = scope.window;
  if (!webDocument || !webWindow) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const input = webDocument.createElement('input');
    input.type = 'file';
    input.accept = CHAT_ATTACHMENT_ACCEPT;
    let settled = false;
    const finish = (file: SelectedFile | null) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(file);
    };
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      finish(
        file
          ? {
              append: (form) => form.append('file', file),
              mimeType: file.type,
              name: file.name,
              sizeBytes: file.size,
            }
          : null,
      );
    });
    webWindow.addEventListener(
      'focus',
      () => {
        webWindow.setTimeout(() => finish(null), 500);
      },
      { once: true },
    );
    input.click();
  });
}

async function pickNativeFile(): Promise<SelectedFile | null> {
  const picker = await import('expo-document-picker');
  const result = await picker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: CHAT_ATTACHMENT_ACCEPT.split(','),
  });
  if (result.canceled) {
    return null;
  }
  const asset = result.assets[0];
  if (!asset) {
    return null;
  }
  const mimeType = asset.mimeType ?? '';
  const fileName = asset.name;
  return {
    append: (form) => {
      form.append('file', { name: fileName, type: mimeType, uri: asset.uri } as unknown as Blob);
    },
    mimeType,
    name: fileName,
    sizeBytes: asset.size ?? null,
  };
}

const styles = StyleSheet.create({
  attachButton: {
    alignItems: 'center',
    backgroundColor: '#1c74e9',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 40,
  },
  attachLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  label: {
    color: '#3f5372',
    fontSize: 12,
    fontWeight: '700',
  },
  root: {
    gap: 8,
  },
});
