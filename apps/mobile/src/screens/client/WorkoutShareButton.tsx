import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { TFunction } from 'i18next';
import { LIGHT } from '../../theme/light';
import { showToast } from '../../shell/client/feedback';

export function WorkoutShareButton(props: { target: React.RefObject<View | null>; t: TFunction }): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  return (
    <Pressable
      accessibilityLabel={props.t('mobile.client.summary.share')}
      accessibilityRole={'button'}
      disabled={busy}
      onPress={() => void shareCard(props.target, props.t, setBusy)}
      style={shareStyle}
    >
      <Text style={shareText}>{props.t('mobile.client.summary.share')}</Text>
    </Pressable>
  );
}

async function shareCard(
  target: React.RefObject<View | null>,
  t: TFunction,
  setBusy: (busy: boolean) => void,
): Promise<void> {
  const view = target.current;
  if (!view) return;
  setBusy(true);
  try {
    const uri = await captureRef(view, { format: 'png', quality: 1 });
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      showToast(t('mobile.client.summary.shareFailed'));
      return;
    }
    await Sharing.shareAsync(uri, { dialogTitle: t('mobile.client.summary.share'), mimeType: 'image/png' });
  } catch {
    showToast(t('mobile.client.summary.shareFailed'));
  } finally {
    setBusy(false);
  }
}

const shareStyle = {
  alignItems: 'center' as const,
  backgroundColor: LIGHT.bgNavy,
  borderRadius: LIGHT.radiusMd,
  marginBottom: 8,
  padding: 14,
};
const shareText = { color: LIGHT.textOnNavy, fontWeight: '700' as const };
