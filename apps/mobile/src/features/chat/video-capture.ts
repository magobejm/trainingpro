import { Platform } from 'react-native';

export type PickedVideo = {
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  uri: string;
};

export const VIDEO_MAX_SECONDS = 30;

/** Records (camera) or picks (library) a short video with expo-image-picker. Returns null when cancelled or denied. */
export async function captureVideo(source: 'camera' | 'library'): Promise<PickedVideo | null> {
  const picker = await import('expo-image-picker');
  const nativeCamera = source === 'camera' && Platform.OS !== 'web';
  if (nativeCamera) {
    const permission = await picker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
  }
  const options = {
    mediaTypes: ['videos' as const],
    videoMaxDuration: VIDEO_MAX_SECONDS,
    videoQuality: picker.UIImagePickerControllerQualityType.Medium,
  };
  const result = nativeCamera ? await picker.launchCameraAsync(options) : await picker.launchImageLibraryAsync(options);
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? toPickedVideo(asset) : null;
}

export function toPickedVideo(asset: {
  fileName?: null | string;
  fileSize?: number;
  mimeType?: string;
  uri: string;
}): PickedVideo {
  const mimeType = asset.mimeType ?? guessMime(asset.uri);
  const extension = mimeType === 'video/quicktime' ? 'mov' : 'mp4';
  return {
    fileName: asset.fileName ?? `serie-${Date.now()}.${extension}`,
    mimeType,
    sizeBytes: asset.fileSize ?? null,
    uri: asset.uri,
  };
}

function guessMime(uri: string): string {
  return uri.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
}
