import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import type { AiMealEstimate } from '../../data/hooks/useNutritionLogs';
import { styles } from './nutrition-plan.styles';

type Translate = (key: string, options?: Record<string, unknown>) => string;
type Props = {
  onUploaded: (path: string, estimate: AiMealEstimate | null) => void;
  t: Translate;
};
type PhotoAsset = { file?: Blob; fileName?: null | string; mimeType?: string; uri: string };

export const MEAL_PHOTO_QUALITY = 0.6;

/** One tap opens the native camera; the photo is uploaded and Gemini returns an estimate of the plate. */
export function MealPhotoButton(props: Props): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [state, setState] = useState<'denied' | 'error' | 'idle' | 'ready' | 'working'>('idle');
  const run = async (source: 'camera' | 'library') => {
    if (!accessToken || state === 'working') return;
    setState('working');
    try {
      const asset = await pickMealPhoto(source);
      if (asset === 'denied') return setState('denied');
      if (!asset) return setState('idle');
      const body = await uploadForEstimate(accessToken, asset);
      if (!body) return setState('error');
      setState('ready');
      props.onUploaded(body.photoPath, body.estimate);
    } catch {
      setState('error');
    }
  };
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Pressable
          accessibilityLabel={props.t('client.nutrition.takePhoto')}
          disabled={state === 'working'}
          onPress={() => void run('camera')}
        >
          <Text style={styles.dayLabel}>{props.t('client.nutrition.takePhoto')}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={props.t('client.nutrition.pickPhoto')}
          disabled={state === 'working'}
          onPress={() => void run('library')}
        >
          <Text style={styles.dayLabel}>{props.t('client.nutrition.pickPhoto')}</Text>
        </Pressable>
      </View>
      <Text style={styles.item}>{statusText(state, props.t)}</Text>
    </View>
  );
}

function statusText(state: string, t: Translate): string {
  if (state === 'working') return t('client.nutrition.photoAnalyzing');
  if (state === 'ready') return t('client.nutrition.photoReady');
  if (state === 'denied') return t('client.nutrition.cameraDenied');
  if (state === 'error') return t('client.nutrition.photoError');
  return '';
}

export async function pickMealPhoto(source: 'camera' | 'library'): Promise<'denied' | PhotoAsset | null> {
  const picker = await import('expo-image-picker');
  if (source === 'camera' && Platform.OS !== 'web') {
    const permission = await picker.requestCameraPermissionsAsync();
    if (!permission.granted) return 'denied';
  }
  const options = { mediaTypes: ['images' as const], quality: MEAL_PHOTO_QUALITY };
  const result =
    source === 'camera' && Platform.OS !== 'web'
      ? await picker.launchCameraAsync(options)
      : await picker.launchImageLibraryAsync(options);
  return result.canceled ? null : (result.assets[0] ?? null);
}

function buildPhotoForm(asset: PhotoAsset): Promise<FormData> {
  return appendPhoto(new FormData(), asset);
}

async function appendPhoto(form: FormData, asset: PhotoAsset): Promise<FormData> {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  if (Platform.OS === 'web') {
    const blob = asset.file ?? (await (await fetch(asset.uri)).blob());
    form.append('file', new Blob([blob], { type: mimeType }), asset.fileName ?? 'meal.jpg');
  } else {
    form.append('file', { name: asset.fileName ?? 'meal.jpg', type: mimeType, uri: asset.uri } as unknown as Blob);
  }
  return form;
}

/** Reads a nutrition label photo on the server and creates the food. Returns null when unreadable. */
export async function uploadLabelPhoto(accessToken: string, asset: PhotoAsset, barcode: string) {
  const form = await buildPhotoForm(asset);
  form.append('barcode', barcode);
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const response = await fetch(`${base}/clients/me/nutrition/foods/label`, {
    body: form,
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Active-Role': 'client' },
    method: 'POST',
  });
  if (!response.ok) return null;
  return (await response.json()) as import('../../data/hooks/useNutritionLogs').FoodSearchHit;
}

async function uploadForEstimate(
  accessToken: string,
  asset: PhotoAsset,
): Promise<{ estimate: AiMealEstimate | null; photoPath: string } | null> {
  const form = await buildPhotoForm(asset);
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const response = await fetch(`${base}/clients/me/nutrition/logs/photo/estimate`, {
    body: form,
    headers: { Authorization: `Bearer ${accessToken}`, 'X-Active-Role': 'client' },
    method: 'POST',
  });
  if (!response.ok) return null;
  return (await response.json()) as { estimate: AiMealEstimate | null; photoPath: string };
}
