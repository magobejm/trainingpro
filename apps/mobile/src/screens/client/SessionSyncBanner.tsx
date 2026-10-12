import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SessionConflict } from '../../data/offline/session-draft';
import { LIGHT } from '../../theme/light';

type SessionSyncBannerProps = {
  conflicts: SessionConflict[];
  onDismiss: () => void;
  onRetry: () => void;
  pendingCount: number;
};

export function SessionSyncBanner(props: SessionSyncBannerProps): React.JSX.Element | null {
  if (props.pendingCount === 0 && props.conflicts.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {props.pendingCount > 0 ? <PendingRow count={props.pendingCount} onRetry={props.onRetry} /> : null}
      {props.conflicts.length > 0 ? <ConflictList conflicts={props.conflicts} onDismiss={props.onDismiss} /> : null}
    </View>
  );
}

function PendingRow({ count, onRetry }: { count: number; onRetry: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.pending} testID={'session-sync-pending'}>
      <Text style={styles.pendingText}>{t('mobile.client.sync.pending', { count })}</Text>
      <Pressable accessibilityRole={'button'} onPress={onRetry} style={styles.action}>
        <Text style={styles.actionText}>{t('mobile.client.sync.retry')}</Text>
      </Pressable>
    </View>
  );
}

function ConflictList({ conflicts, onDismiss }: { conflicts: SessionConflict[]; onDismiss: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.conflict} testID={'session-sync-conflict'}>
      {conflicts.map((conflict) => (
        <Text key={conflict.op.id} style={styles.conflictText}>
          {t(`mobile.client.sync.conflict.${conflict.reason}`)}
        </Text>
      ))}
      <Pressable accessibilityRole={'button'} onPress={onDismiss} style={styles.action}>
        <Text style={styles.actionText}>{t('mobile.client.sync.dismiss')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  pending: {
    backgroundColor: LIGHT.accentSoft,
    borderRadius: LIGHT.radiusMd,
    gap: 8,
    padding: 12,
  },
  pendingText: { color: LIGHT.accentDark, fontSize: 14, fontWeight: '700' },
  conflict: {
    backgroundColor: LIGHT.redSoft,
    borderRadius: LIGHT.radiusMd,
    gap: 8,
    padding: 12,
  },
  conflictText: { color: LIGHT.error, fontSize: 14, fontWeight: '600' },
  action: { alignSelf: 'flex-start', paddingVertical: 4 },
  actionText: { color: LIGHT.accentDark, fontSize: 14, fontWeight: '700' },
});
