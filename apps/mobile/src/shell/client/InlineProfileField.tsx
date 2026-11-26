import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import type { ClientMe } from '../../data/hooks/useClientMeQuery';
import { pickMealPhoto } from '../../screens/client/MealPhotoButton';
import type { MeasurementKey } from '../../screens/client/client-measures.helpers';
import { useRecordMeasurementMutation } from '../../screens/client/use-client-progress';
import { LIGHT } from '../../theme/light';
import { AvatarImage } from './client-shell.primitives';
import { s } from './client-shell.styles';
import { commitProfileMeasure, commitProfilePhone, commitProfileText } from './client-profile-edit';
import type { PickedImageFile } from './open-image-file';
import { useUpdateOwnProfileMutation, useUploadOwnAvatarMutation } from './use-client-profile';

type CommitResult = 'failed' | 'invalid' | 'saved' | 'skip';
type FinishSource = 'blur' | 'commit';
type Editor = ReturnType<typeof useInlineEditor>;

export function ProfileIdentityFields(props: { client: ClientMe }): React.JSX.Element {
  const { t } = useTranslation();
  const save = useUpdateOwnProfileMutation();
  return (
    <View style={styles.stack}>
      <InlineProfileField
        label={t('mobile.client.profile.firstName')}
        onCommit={(raw) => saveText(save.mutateAsync, props.client.firstName, raw, 'firstName')}
        value={props.client.firstName}
      />
      <InlineProfileField
        label={t('mobile.client.profile.lastName')}
        onCommit={(raw) => saveText(save.mutateAsync, props.client.lastName, raw, 'lastName')}
        value={props.client.lastName}
      />
      <View style={s.fieldCard}>
        <Text style={s.fieldLabel}>{t('mobile.client.profile.email')}</Text>
        <Text style={s.fieldValue}>{props.client.email || '–'}</Text>
      </View>
      <InlineProfileField
        keyboard={'phone-pad'}
        label={t('mobile.client.profile.phone')}
        onCommit={(raw) => savePhone(save.mutateAsync, props.client.phone, raw)}
        value={props.client.phone ?? ''}
      />
    </View>
  );
}

export function ProfileMeasureStat(props: {
  client: ClientMe;
  label: string;
  measure: MeasurementKey;
  variant: 'hero' | 'square';
}): React.JSX.Element {
  const current = props.client[props.measure];
  const save = useRecordMeasurementMutation();
  const editor = useInlineEditor(current == null ? '' : String(current), (raw) =>
    saveMeasure(save.mutateAsync, current, props.measure, raw),
  );
  if (props.variant === 'hero') return <HeroMeasure editor={editor} label={props.label} />;
  return <SquareMeasure editor={editor} label={props.label} />;
}

export function ProfileAvatarButton(props: { client: ClientMe }): React.JSX.Element {
  const { t } = useTranslation();
  const upload = useUploadOwnAvatarMutation();
  const [message, setMessage] = useState('');
  return (
    <View style={styles.avatarColumn}>
      <View style={styles.avatarSlot}>
        <View style={s.heroAvatarWrap}>
          <AvatarImage avatarUrl={props.client.avatarUrl} size={64} />
        </View>
        {Platform.OS === 'web' ? (
          <WebAvatarInput
            disabled={upload.isPending}
            label={t('mobile.client.profile.photo')}
            onFile={(file) => void uploadAvatarFile(file, upload.mutateAsync, setMessage, t)}
          />
        ) : (
          <Pressable
            accessibilityLabel={t('mobile.client.profile.photo')}
            disabled={upload.isPending}
            onPress={() => void pickNativeAvatar(upload.mutateAsync, setMessage, t)}
            style={styles.avatarHit}
          />
        )}
        <View pointerEvents={'none'} style={styles.avatarPencil}>
          {upload.isPending ? <ActivityIndicator color={LIGHT.accent} size={'small'} /> : <PencilMark editing={false} />}
        </View>
      </View>
      {message ? <Text style={styles.error}>{message}</Text> : null}
    </View>
  );
}

function InlineProfileField(props: {
  keyboard?: 'default' | 'phone-pad';
  label: string;
  onCommit: (raw: string) => Promise<CommitResult>;
  value: string;
}): React.JSX.Element {
  const editor = useInlineEditor(props.value, props.onCommit);
  return (
    <View style={s.fieldCard}>
      <View style={styles.row}>
        <View style={styles.grow}>
          <Text style={s.fieldLabel}>{props.label}</Text>
          {editor.editing ? (
            <FieldInput editor={editor} keyboard={props.keyboard ?? 'default'} />
          ) : (
            <Text style={s.fieldValue}>{props.value || '–'}</Text>
          )}
        </View>
        <CommitButton editor={editor} />
      </View>
      {editor.message ? <Text style={styles.error}>{editor.message}</Text> : null}
    </View>
  );
}

function HeroMeasure(props: { editor: Editor; label: string }): React.JSX.Element {
  return (
    <View style={s.profileStatCol}>
      <View style={styles.heroValue}>
        {props.editor.editing ? (
          <FieldInput editor={props.editor} keyboard={'decimal-pad'} />
        ) : (
          <Text style={s.profileStatValue}>{props.editor.draft || '–'}</Text>
        )}
        <CommitButton compact editor={props.editor} />
      </View>
      <Text style={[s.profileStatLabel, props.editor.message ? styles.error : null]}>
        {props.editor.message || props.label}
      </Text>
    </View>
  );
}

function SquareMeasure(props: { editor: Editor; label: string }): React.JSX.Element {
  return (
    <View style={styles.square}>
      {props.editor.editing ? (
        <FieldInput editor={props.editor} keyboard={'decimal-pad'} />
      ) : (
        <Text style={styles.squareValue}>{props.editor.draft || '–'}</Text>
      )}
      <Text style={[styles.squareLabel, props.editor.message ? styles.error : null]}>
        {props.editor.message || props.label}
      </Text>
      <View style={styles.squarePencil}>
        <CommitButton compact editor={props.editor} />
      </View>
    </View>
  );
}

function FieldInput(props: { editor: Editor; keyboard: 'decimal-pad' | 'default' | 'phone-pad' }): React.JSX.Element {
  return (
    <TextInput
      autoFocus
      keyboardType={props.keyboard}
      onBlur={() => void props.editor.finish('blur')}
      onChangeText={props.editor.setDraft}
      onSubmitEditing={() => void props.editor.finish('commit')}
      returnKeyType={'done'}
      selectTextOnFocus
      style={styles.input}
      value={props.editor.draft}
    />
  );
}

function CommitButton(props: { compact?: boolean; editor: Editor }): React.JSX.Element {
  const { t } = useTranslation();
  const editing = props.editor.editing;
  const label = editing ? 'mobile.client.profile.save' : 'mobile.client.profile.edit';
  return (
    <Pressable
      accessibilityLabel={t(label)}
      disabled={props.editor.busy}
      hitSlop={8}
      onPress={() => void props.editor.finish('commit')}
      onPressIn={() => {
        props.editor.viaButton.current = true;
      }}
      onPressOut={() => {
        props.editor.viaButton.current = false;
      }}
      style={[styles.pencil, props.compact ? styles.pencilCompact : null]}
    >
      {props.editor.busy ? <ActivityIndicator color={LIGHT.accent} size={'small'} /> : <PencilMark editing={editing} />}
    </Pressable>
  );
}

function PencilMark(props: { editing: boolean }): React.JSX.Element {
  return <Text style={styles.pencilText}>{props.editing ? '✓' : '✎'}</Text>;
}

function useInlineEditor(
  value: string,
  onCommit: (raw: string) => Promise<CommitResult>,
): {
  busy: boolean;
  draft: string;
  editing: boolean;
  finish: (source: FinishSource) => Promise<void>;
  message: string;
  setDraft: (value: string) => void;
  viaButton: React.MutableRefObject<boolean>;
} {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const openedAt = useRef(0);
  const viaButton = useRef(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  async function finish(source: FinishSource): Promise<void> {
    if (!editing) return;
    if (source === 'blur' && (viaButton.current || Date.now() - openedAt.current < 400)) return;
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await onCommit(draft);
      if (result === 'invalid') setMessage(t('mobile.client.profile.invalid'));
      else if (result === 'failed') setMessage(t('mobile.client.profile.saveError'));
      else {
        setMessage('');
        setEditing(false);
      }
    } finally {
      lock.current = false;
      setBusy(false);
      viaButton.current = false;
    }
  }

  return {
    busy,
    draft,
    editing,
    finish: async (source) => {
      if (source === 'commit' && !editing) {
        viaButton.current = false;
        openedAt.current = Date.now();
        setDraft(value);
        setMessage('');
        setEditing(true);
        return;
      }
      await finish(source);
    },
    message,
    setDraft,
    viaButton,
  };
}

async function saveText(
  mutate: (body: { firstName?: string; lastName?: string }) => Promise<unknown>,
  current: string,
  raw: string,
  key: 'firstName' | 'lastName',
): Promise<CommitResult> {
  const parsed = commitProfileText(current, raw, 80);
  if ('error' in parsed) return 'invalid';
  if ('skip' in parsed) return 'skip';
  try {
    await mutate({ [key]: parsed.value });
    return 'saved';
  } catch {
    return 'failed';
  }
}

async function savePhone(
  mutate: (body: { phone: string | null }) => Promise<unknown>,
  current: string | null,
  raw: string,
): Promise<CommitResult> {
  const parsed = commitProfilePhone(current, raw);
  if ('error' in parsed) return 'invalid';
  if ('skip' in parsed) return 'skip';
  try {
    await mutate({ phone: parsed.value });
    return 'saved';
  } catch {
    return 'failed';
  }
}

async function saveMeasure(
  mutate: (body: Partial<Record<MeasurementKey, number>>) => Promise<unknown>,
  current: number | null,
  key: MeasurementKey,
  raw: string,
): Promise<CommitResult> {
  const parsed = commitProfileMeasure(current, key, raw);
  if ('error' in parsed) return 'invalid';
  if ('skip' in parsed) return 'skip';
  try {
    await mutate({ [key]: parsed.value });
    return 'saved';
  } catch {
    return 'failed';
  }
}

type AvatarShot = { file?: Blob; name: string; type: string; uri: string };
type AvatarUpload = (shot: AvatarShot) => Promise<unknown>;

function WebAvatarInput(props: {
  disabled: boolean;
  label: string;
  onFile: (file: PickedImageFile) => void;
}): React.JSX.Element {
  return React.createElement('input', {
    accept: 'image/jpeg,image/png,image/webp',
    'aria-label': props.label,
    disabled: props.disabled,
    onChange: (event: FileChange) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = '';
      if (file) props.onFile(file);
    },
    style: webFileStyle,
    type: 'file',
  });
}

type FileChange = { currentTarget: { files: ArrayLike<PickedImageFile> | null; value: string } };

const webFileStyle = {
  bottom: -12,
  cursor: 'pointer',
  fontSize: 64,
  left: -12,
  opacity: 0,
  position: 'absolute' as const,
  right: -12,
  top: -12,
  zIndex: 2,
};

async function pickNativeAvatar(
  upload: AvatarUpload,
  setMessage: (message: string) => void,
  t: (key: string) => string,
): Promise<void> {
  const asset = await pickMealPhoto('library');
  if (!asset || asset === 'denied') return;
  await sendAvatar(
    { file: asset.file, name: asset.fileName ?? 'avatar.jpg', type: asset.mimeType ?? 'image/jpeg', uri: asset.uri },
    upload,
    setMessage,
    t,
  );
}

function uploadAvatarFile(
  file: PickedImageFile,
  upload: AvatarUpload,
  setMessage: (message: string) => void,
  t: (key: string) => string,
): Promise<void> {
  return sendAvatar({ file, name: file.name, type: file.type || 'image/jpeg', uri: '' }, upload, setMessage, t);
}

async function sendAvatar(
  shot: AvatarShot,
  upload: AvatarUpload,
  setMessage: (message: string) => void,
  t: (key: string) => string,
): Promise<void> {
  try {
    await upload(shot);
    setMessage('');
  } catch {
    setMessage(t('mobile.client.profile.photoError'));
  }
}

const styles = StyleSheet.create({
  avatarColumn: { alignItems: 'center', width: 72 },
  avatarHit: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  avatarPencil: {
    alignItems: 'center',
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.borderStrong,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    bottom: -2,
    height: 26,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 26,
  },
  avatarSlot: { height: 64, width: 64 },
  error: { color: LIGHT.error, fontSize: 11 },
  grow: { flex: 1 },
  heroValue: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  input: { color: LIGHT.textStrong, fontSize: 14, fontWeight: '700', minWidth: 36, padding: 0 },
  pencil: {
    alignItems: 'center',
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusFull,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  pencilCompact: { height: 22, width: 22 },
  pencilText: { color: LIGHT.accentDark, fontSize: 14, fontWeight: '700' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  square: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radiusLg,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    padding: 8,
  },
  squareLabel: {
    color: LIGHT.accentMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  squarePencil: { position: 'absolute', right: 4, top: 4 },
  squareValue: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
  stack: { gap: 12 },
});
