import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '../theme/tokens';
import { Badge, type BadgeTone } from '../primitives/Badge';
import { StatusDot } from '../primitives/StatusDot';
import { Button } from '../primitives/Button';
import { Card } from '../primitives/Card';

export type ClientCardItem = {
  id: string;
  subtitle: string;
  title: string;
  avatarUrl?: string | null;
  objective?: string;
  statusDot?: { reason: string; tone: BadgeTone };
  statusLabel?: string;
  statusTone?: BadgeTone;
};
type Props = {
  vertical?: boolean;
  palette?: { background: string; text: string; muted: string; border: string; accent: string; soft: string };
  actionLabel?: string;
  items: ClientCardItem[];
  onActionPress?: (clientId: string) => void;
  onItemPress: (clientId: string) => void;
  onToggleSelect?: (clientId: string) => void;
  selectedId?: string;
  selectedIds?: string[];
  selectionMode?: boolean;
};
function ClientAvatar({ item, palette }: { item: ClientCardItem; palette?: Props['palette'] }): React.JSX.Element {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = item.title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return item.avatarUrl && failedUrl !== item.avatarUrl ? (
    <Image
      accessibilityLabel={item.title}
      onError={() => setFailedUrl(item.avatarUrl ?? null)}
      source={{ uri: item.avatarUrl }}
      style={styles.avatar}
    />
  ) : (
    <View style={[styles.initials, palette && { backgroundColor: palette.soft }]}>
      <Text style={[styles.initialsText, palette && { color: palette.accent }]}>{initials}</Text>
    </View>
  );
}
export function ClientCardRow(props: Props): React.JSX.Element {
  return (
    <View {...{ dataSet: { 'density-list': 'true' } }} style={[styles.row, props.vertical && styles.vertical]}>
      {props.items.map((item) => (
        <Card
          interactive
          densityRow
          key={item.id}
          style={[
            styles.card,
            props.vertical && styles.fullCard,
            props.palette && { backgroundColor: props.palette.background, borderColor: props.palette.border },
            (props.selectedId === item.id || props.selectedIds?.includes(item.id)) && styles.selected,
          ]}
        >
          <Pressable
            accessibilityRole={props.selectionMode ? 'checkbox' : 'button'}
            accessibilityState={props.selectionMode ? { checked: Boolean(props.selectedIds?.includes(item.id)) } : undefined}
            accessibilityLabel={item.statusDot ? `${item.title}. ${item.statusDot.reason}` : item.title}
            onPress={() => (props.selectionMode ? props.onToggleSelect?.(item.id) : props.onItemPress(item.id))}
            style={styles.content}
          >
            {props.selectionMode ? (
              <Text style={[styles.mark, props.selectedIds?.includes(item.id) && styles.markOn]}>
                {props.selectedIds?.includes(item.id) ? '✓' : '○'}
              </Text>
            ) : null}
            <ClientAvatar item={item} palette={props.palette} />
            <View style={styles.titleRow}>
              <Text style={[styles.title, props.palette && { color: props.palette.text }]}>{item.title}</Text>
              {item.statusDot ? <StatusDot reason={item.statusDot.reason} tone={item.statusDot.tone} /> : null}
            </View>
            <Text style={[styles.subtitle, props.palette && { color: props.palette.muted }]}>
              {item.objective ?? item.subtitle}
            </Text>
            {item.objective ? (
              <Text style={[styles.subtitle, props.palette && { color: props.palette.muted }]}>{item.subtitle}</Text>
            ) : null}
            {item.statusLabel ? <Badge label={item.statusLabel} tone={item.statusTone ?? 'neutral'} /> : null}
          </Pressable>
          {props.actionLabel && props.onActionPress ? (
            <Button label={props.actionLabel} onPress={() => props.onActionPress?.(item.id)} size="sm" />
          ) : null}
        </Card>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  vertical: { flexDirection: 'column', width: '100%' },
  fullCard: { flexBasis: 'auto', flexGrow: 0, maxWidth: '100%', width: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  card: { flexGrow: 1, flexBasis: 240, maxWidth: 360, gap: space.md },
  selected: { borderColor: colors.primary },
  mark: { color: colors.textMuted, fontSize: fontSize.lg, fontWeight: '700' },
  markOn: { color: colors.primary },
  content: { gap: space.sm, alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: radius.pill },
  initials: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: space.sm },
  title: { color: colors.text, flexShrink: 1, fontSize: fontSize.md, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm },
});
