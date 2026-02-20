import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import '../../i18n';
import { useUploadPolicyMutation } from '../../data/hooks/useChat';

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

const MIME_OPTIONS = [
  { id: 'image/jpeg', kind: 'IMAGE' },
  { id: 'application/pdf', kind: 'PDF' },
  { id: 'audio/mpeg', kind: 'AUDIO' },
] as const;

export function AttachmentsPicker(props: Props): React.JSX.Element {
  const vm = useAttachmentsPickerModel(props);
  return <AttachmentsPickerView {...vm} />;
}

function useAttachmentsPickerModel(props: Props) {
  const { t } = useTranslation();
  const uploadPolicy = useUploadPolicyMutation();
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState<(typeof MIME_OPTIONS)[number]['id']>('image/jpeg');
  const [sizeKbText, setSizeKbText] = useState('250');
  const activeKind = useMemo(() => resolveKind(mimeType), [mimeType]);
  const canAttach = props.threadId.length > 0 && !uploadPolicy.isPending;
  const onPressAttach = () =>
    attachFile(props, {
      activeKind,
      fileName,
      mimeType,
      onClearFileName: () => setFileName(''),
      sizeKbText,
      t,
      uploadPolicy,
    });
  return {
    canAttach,
    fileName,
    mimeType,
    onPressAttach,
    setFileName,
    setMimeType,
    setSizeKbText,
    sizeKbText,
    t,
  };
}

function AttachmentsPickerView(props: ReturnType<typeof useAttachmentsPickerModel>) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{props.t('coach.chat.attachments.title')}</Text>
      <View style={styles.row}>
        {renderMimeButtons(props.mimeType, props.setMimeType, props.t)}
      </View>
      <TextInput
        onChangeText={props.setFileName}
        placeholder={props.t('coach.chat.attachments.namePlaceholder')}
        style={styles.input}
        value={props.fileName}
      />
      <TextInput
        onChangeText={props.setSizeKbText}
        placeholder={props.t('coach.chat.attachments.sizePlaceholder')}
        style={styles.input}
        value={props.sizeKbText}
      />
      <Pressable disabled={!props.canAttach} onPress={props.onPressAttach} style={styles.button}>
        <Text style={styles.buttonLabel}>{props.t('coach.chat.attachments.add')}</Text>
      </Pressable>
    </View>
  );
}

type AttachArgs = {
  activeKind: 'AUDIO' | 'IMAGE' | 'PDF';
  fileName: string;
  mimeType: (typeof MIME_OPTIONS)[number]['id'];
  onClearFileName: () => void;
  sizeKbText: string;
  t: (key: string) => string;
  uploadPolicy: ReturnType<typeof useUploadPolicyMutation>;
};

async function attachFile(props: Props, args: AttachArgs): Promise<void> {
  try {
    const sizeBytes = parseSizeBytes(args.sizeKbText);
    const policy = await args.uploadPolicy.mutateAsync({
      fileName: args.fileName,
      mimeType: args.mimeType,
      sizeBytes,
      threadId: props.threadId,
    });
    props.onAttach({
      fileName: args.fileName.trim() || fallbackName(args.activeKind),
      kind: policy.kind,
      mimeType: args.mimeType,
      sizeBytes,
      storagePath: policy.path,
    });
    args.onClearFileName();
  } catch {
    props.onError(args.t('coach.chat.attachments.error'));
  }
}

function renderMimeButtons(
  activeMimeType: string,
  onChange: (value: (typeof MIME_OPTIONS)[number]['id']) => void,
  t: (key: string) => string,
) {
  return MIME_OPTIONS.map((item) => (
    <Pressable
      key={item.id}
      onPress={() => onChange(item.id)}
      style={[styles.mimeButton, activeMimeType === item.id ? styles.mimeButtonActive : null]}
    >
      <Text style={styles.mimeLabel}>{renderKindLabel(item.kind, t)}</Text>
    </Pressable>
  ));
}

function renderKindLabel(kind: 'AUDIO' | 'IMAGE' | 'PDF', t: (key: string) => string): string {
  const key = `coach.chat.attachments.kind.${kind.toLowerCase()}`;
  return t(key);
}

function fallbackName(kind: 'AUDIO' | 'IMAGE' | 'PDF'): string {
  if (kind === 'AUDIO') {
    return 'audio-note.mp3';
  }
  if (kind === 'PDF') {
    return 'document.pdf';
  }
  return 'image.jpg';
}

function parseSizeBytes(sizeKbText: string): number {
  const sizeKb = Number(sizeKbText);
  if (!Number.isFinite(sizeKb) || sizeKb <= 0) {
    throw new Error('Invalid size');
  }
  return Math.round(sizeKb * 1000);
}

function resolveKind(mimeType: string): 'AUDIO' | 'IMAGE' | 'PDF' {
  return MIME_OPTIONS.find((item) => item.id === mimeType)?.kind ?? 'IMAGE';
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
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d6deea',
    borderRadius: 10,
    borderWidth: 1,
    color: '#12253f',
    minHeight: 40,
    paddingHorizontal: 10,
  },
  label: {
    color: '#4a607f',
    fontSize: 12,
    fontWeight: '700',
  },
  mimeButton: {
    backgroundColor: '#eff4ff',
    borderColor: '#d1def5',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mimeButtonActive: {
    backgroundColor: '#dce8ff',
    borderColor: '#6f99f0',
  },
  mimeLabel: {
    color: '#2d4b80',
    fontSize: 11,
    fontWeight: '700',
  },
  root: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
