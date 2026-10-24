import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { LIGHT } from '../../theme/light';
import type { ProgressPose } from './client-measures.helpers';
import { ProgressPhotoSilhouette } from './progress-photo-silhouette';

const FACING = 'back' as const;

type Props = { onCapture: (uri: string) => void; pose: ProgressPose };

export function ProgressPhotoCamera(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  if (!permission?.granted) return <PermissionPrompt onRequest={() => void requestPermission()} t={t} />;
  return (
    <View style={styles.fill}>
      <CameraView facing={FACING} ref={camera} style={styles.fill} />
      <View pointerEvents={'none'} style={styles.overlay}>
        <ProgressPhotoSilhouette pose={props.pose} />
      </View>
      <Pressable onPress={() => void shoot(camera, props.onCapture)} style={styles.shutter}>
        <Text style={styles.shutterText}>{t('client.measures.capture.shutter')}</Text>
      </Pressable>
    </View>
  );
}

function PermissionPrompt(props: { onRequest: () => void; t: (key: string) => string }): React.JSX.Element {
  return (
    <View style={styles.fallback}>
      <Text style={styles.permission}>{props.t('client.measures.capture.permission')}</Text>
      <Pressable onPress={props.onRequest} style={styles.permissionBtn}>
        <Text style={styles.permissionBtnText}>{props.t('client.measures.capture.permissionAction')}</Text>
      </Pressable>
    </View>
  );
}

async function shoot(camera: React.RefObject<CameraView | null>, onCapture: (uri: string) => void): Promise<void> {
  const photo = await camera.current?.takePictureAsync({ quality: 0.7 });
  if (photo?.uri) onCapture(photo.uri);
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  fill: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  permission: { color: LIGHT.textOnNavy, fontSize: 15, marginBottom: 16, textAlign: 'center' },
  permissionBtn: {
    backgroundColor: LIGHT.accent,
    borderRadius: LIGHT.radiusFull,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  permissionBtnText: { color: LIGHT.textOnNavy, fontWeight: '700' },
  shutter: {
    alignSelf: 'center',
    backgroundColor: LIGHT.bgCard,
    borderRadius: LIGHT.radiusFull,
    bottom: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    position: 'absolute',
  },
  shutterText: { color: LIGHT.textStrong, fontWeight: '700' },
});
