import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { styles } from './nutrition-plan.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function MealPhotoButton(props: { onUploaded: (path: string) => void; t: Translate }): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [label, setLabel] = useState(props.t('client.nutrition.addPhoto'));
  return (
    <Pressable
      accessibilityLabel={props.t('client.nutrition.addPhoto')}
      onPress={() => void pickPhoto(accessToken, props, setLabel)}
    >
      <Text style={styles.dayLabel}>{label}</Text>
    </Pressable>
  );
}

async function pickPhoto(
  accessToken: string | null,
  props: { onUploaded: (path: string) => void; t: Translate },
  setLabel: (value: string) => void,
): Promise<void> {
  if (!accessToken) return;
  const picker = await import('expo-document-picker');
  const result = await picker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: ['image/jpeg', 'image/png', 'image/webp'],
  });
  const file = result.canceled ? undefined : result.assets[0];
  if (!file) return;
  const form = new FormData();
  form.append('file', file.file ?? ({ name: file.name, type: file.mimeType, uri: file.uri } as unknown as Blob));
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const response = await fetch(`${base}/clients/me/nutrition/logs/photo`, {
    body: form,
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Active-Role': 'client' },
    method: 'POST',
  });
  if (!response.ok) return;
  const body = (await response.json()) as { photoPath: string };
  setLabel(props.t('client.nutrition.photoReady'));
  props.onUploaded(body.photoPath);
}
