import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  avatarUrl: null | string;
  id: string;
  name: string;
  objective?: string;
  onSelect: (clientId: string) => void;
  progressLabel?: string;
  progressTitle?: string;
  selected: boolean;
  statusTone: 'success' | 'warning';
  weightLabel?: string;
  weightTitle?: string;
};

export function ClientRowCard(props: Props): React.JSX.Element {
  const [hovered, setHovered] = React.useState(false);
  const view = readCardView(props);
  const rowStyle = readRowStyle(hovered, props.selected);
  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => props.onSelect(props.id)}
      style={rowStyle}
    >
      <View style={styles.avatarWrap}>
        <AvatarBadge label={props.name} statusTone={props.statusTone} url={props.avatarUrl} />
      </View>
      <View style={styles.textWrap}>
        <Text numberOfLines={2} style={styles.rowTitle}>
          {props.name}
        </Text>
        {view.showDetails ? (
          <View style={styles.objectiveBadge}>
            <Text numberOfLines={2} style={styles.objectiveLabel}>
              {props.objective}
            </Text>
          </View>
        ) : null}
      </View>
      {view.showDetails ? <MetricsRow props={props} /> : null}
    </Pressable>
  );
}

function readRowStyle(hovered: boolean, selected: boolean) {
  return [styles.row, hovered ? styles.rowHover : null, selected ? styles.rowSelected : null];
}

function readCardView(props: Props): { showDetails: boolean } {
  return {
    showDetails: Boolean(props.objective || props.weightLabel || props.progressLabel),
  };
}

function MetricsRow(props: { props: Props }): React.JSX.Element {
  return (
    <View style={styles.metricsRow}>
      <MetricCell label={props.props.weightTitle ?? ''} value={props.props.weightLabel ?? ''} />
      <MetricCell label={props.props.progressTitle ?? ''} value={props.props.progressLabel ?? ''} />
    </View>
  );
}

function AvatarBadge(props: { label: string; statusTone: 'success' | 'warning'; url: null | string }): React.JSX.Element {
  const dotStyle = props.statusTone === 'success' ? styles.statusDotSuccess : styles.statusDotWarning;
  if (props.url) {
    return (
      <View style={styles.avatarRing}>
        <Image source={{ uri: props.url }} style={styles.avatarImage} />
        <View style={[styles.statusDot, dotStyle]} />
      </View>
    );
  }
  return (
    <View style={styles.avatarRing}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>{readInitials(props.label)}</Text>
      </View>
      <View style={[styles.statusDot, dotStyle]} />
    </View>
  );
}

function MetricCell(props: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricTitle}>{props.label}</Text>
      <Text style={styles.metricValue}>{props.value}</Text>
    </View>
  );
}

function readInitials(name: string): string {
  const [a = 'C', b = 'L'] = name
    .split(' ')
    .filter((item) => item.length > 0)
    .map((item) => item[0]?.toUpperCase() ?? '');
  return `${a}${b}`;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 19,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  avatarImage: {
    borderRadius: 19,
    height: 78,
    objectFit: 'cover',
    width: 78,
  },
  avatarLabel: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  avatarRing: {
    position: 'relative',
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  metricCell: {
    flex: 1,
    gap: space.xs,
    minWidth: 72,
  },
  metricsRow: {
    borderTopColor: colors.background,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.md,
    paddingTop: space.md,
    width: '100%',
  },
  metricTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  objectiveBadge: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: space.xs,
    minHeight: 28,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  objectiveLabel: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.7,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.background,
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 320,
    minWidth: 290,
    padding: space.xl,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    transform: [{ translateY: 0 }],
    transitionDuration: '140ms',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionTimingFunction: 'ease-out',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  rowHover: {
    shadowOpacity: 0.09,
    shadowRadius: 24,
    transform: [{ translateY: -6 }],
  },
  rowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'center',
  },
  statusDot: {
    borderColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    bottom: -2,
    height: 16,
    position: 'absolute',
    right: -2,
    width: 16,
  },
  statusDotSuccess: {
    backgroundColor: colors.success,
  },
  statusDotWarning: {
    backgroundColor: colors.warning,
  },
  textWrap: {
    gap: space.sm,
    marginTop: space.lg,
    minHeight: 86,
    width: '100%',
  },
});
