import React, { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';
import { PROGRESS_POSES, type ProgressPose } from './client-measures.helpers';
import { ProgressPhotoCamera } from './progress-photo-camera';
import { useUploadProgressPhotoMutation, type ProgressShot } from './use-client-progress';

type Props = { onClose: () => void };

export function ProgressPhotoCapture(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const upload = useUploadProgressPhotoMutation();
  const [pose, setPose] = useState<ProgressPose>('front');
  const [shot, setShot] = useState<ProgressShot | null>(null);
  return (
    <Modal animationType={'slide'} onRequestClose={props.onClose} visible>
      <View style={styles.root}>
        <PoseBar disabled={shot !== null} onClose={props.onClose} pose={pose} setPose={setPose} t={t} />
        {shot ? <Preview shot={shot} /> : <CameraStep onCapture={(uri) => setShot(cameraShot(pose, uri))} pose={pose} />}
        <CaptureActions
          busy={upload.isPending}
          failed={upload.isError}
          onClear={() => setShot(null)}
          onPick={() => void pickInto(setShot)}
          onSend={() => shot && void sendShot(upload.mutateAsync, shot, pose, props.onClose)}
          shot={shot}
          t={t}
        />
      </View>
    </Modal>
  );
}

function CameraStep(props: { onCapture: (uri: string) => void; pose: ProgressPose }): React.JSX.Element {
  return <ProgressPhotoCamera onCapture={props.onCapture} pose={props.pose} />;
}

function Preview(props: { shot: ProgressShot }): React.JSX.Element {
  return <Image resizeMode={'contain'} source={{ uri: props.shot.uri }} style={styles.preview} />;
}

function PoseBar(props: {
  disabled: boolean;
  onClose: () => void;
  pose: ProgressPose;
  setPose: (pose: ProgressPose) => void;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.bar}>
      <Pressable onPress={props.onClose}>
        <Text style={styles.barText}>{props.t('client.measures.capture.close')}</Text>
      </Pressable>
      <View style={styles.poses}>
        {PROGRESS_POSES.map((pose) => (
          <Pressable
            disabled={props.disabled}
            key={pose}
            onPress={() => props.setPose(pose)}
            style={chipStyle(pose === props.pose)}
          >
            <Text style={styles.chipText}>{props.t(`client.measures.photos.pose.${pose}`)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function chipStyle(active: boolean) {
  return [styles.chip, active ? styles.chipActive : null];
}

function cameraShot(pose: ProgressPose, uri: string): ProgressShot {
  return { name: `progress-${pose}.jpg`, type: 'image/jpeg', uri };
}

async function pickInto(setShot: (shot: ProgressShot | null) => void): Promise<void> {
  const shot = await pickGallery();
  if (shot) setShot(shot);
}

async function pickGallery(): Promise<ProgressShot | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: ['image/jpeg', 'image/png', 'image/webp'],
  });
  const file = result.canceled ? undefined : result.assets[0];
  if (!file) return null;
  return { file: file.file, name: file.name, type: file.mimeType ?? 'image/jpeg', uri: file.uri };
}

async function sendShot(
  mutate: ReturnType<typeof useUploadProgressPhotoMutation>['mutateAsync'],
  shot: ProgressShot,
  pose: ProgressPose,
  onClose: () => void,
): Promise<void> {
  try {
    await mutate({ pose, shot });
    onClose();
  } catch {
    return;
  }
}

function CaptureActions(props: {
  busy: boolean;
  failed: boolean;
  onClear: () => void;
  onPick: () => void;
  onSend: () => void;
  shot: ProgressShot | null;
  t: (key: string) => string;
}): React.JSX.Element {
  return (
    <View style={styles.actions}>
      {props.failed ? <Text style={styles.error}>{props.t('client.measures.photos.error')}</Text> : null}
      {props.shot ? (
        <ActionRow
          primary={props.t('client.measures.capture.send')}
          secondary={props.t('client.measures.capture.retake')}
          {...props}
        />
      ) : (
        <Pressable onPress={props.onPick} style={styles.primary}>
          <Text style={styles.primaryText}>{props.t('client.measures.capture.gallery')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function ActionRow(props: {
  busy: boolean;
  onClear: () => void;
  onSend: () => void;
  primary: string;
  secondary: string;
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Pressable onPress={props.onClear} style={styles.secondary}>
        <Text style={styles.secondaryText}>{props.secondary}</Text>
      </Pressable>
      <Pressable disabled={props.busy} onPress={props.onSend} style={styles.primary}>
        <Text style={styles.primaryText}>{props.primary}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 8, padding: 16 },
  bar: { alignItems: 'center', flexDirection: 'row', gap: 12, padding: 16 },
  barText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  chip: {
    borderColor: LIGHT.textOnNavyMuted,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: LIGHT.accent },
  chipText: { color: LIGHT.textOnNavy, fontSize: 12, fontWeight: '700' },
  error: { color: LIGHT.redSoft, textAlign: 'center' },
  poses: { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  preview: { flex: 1 },
  primary: {
    alignItems: 'center',
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusFull,
    flex: 1,
    paddingVertical: 12,
  },
  primaryText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  root: { backgroundColor: LIGHT.bgNavy, flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  secondary: {
    alignItems: 'center',
    borderColor: LIGHT.textOnNavyMuted,
    borderRadius: LIGHT.radiusFull,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryText: { color: LIGHT.textOnNavy, fontWeight: '700' },
});
