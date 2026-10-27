import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, space } from '@trainerpro/ui';
import type { ComparePhoto } from './progress/comparison';

type Translate = (key: string) => string;
type FrameSize = { height: number; width: number };

const RANGE = 'range';
const START = 50;

export function CompareReveal(props: {
  after: ComparePhoto | null;
  before: ComparePhoto | null;
  t: Translate;
}): React.JSX.Element {
  const [position, setPosition] = useState(START);
  const [frame, setFrame] = useState<FrameSize>({ height: 0, width: 0 });
  const both = Boolean(props.before && props.after);
  if (!props.before && !props.after) return <Text style={styles.note}>{props.t('coach.compare.noPhoto')}</Text>;
  return (
    <View style={styles.block}>
      <View onLayout={(event) => setFrame(event.nativeEvent.layout)} style={styles.frame}>
        <RevealPhotos after={props.after} before={props.before} frame={frame} position={position} />
        {both ? <RevealChrome position={position} t={props.t} /> : null}
        {both ? (
          <input
            aria-label={props.t('coach.compare.slider')}
            max={100}
            min={0}
            onChange={(event) => setPosition(readPosition(event.target.value))}
            style={rangeStyle}
            type={RANGE}
            value={position}
          />
        ) : null}
      </View>
      {both ? <Text style={styles.caption}>{props.t('coach.compare.drag')}</Text> : null}
    </View>
  );
}

function RevealPhotos(props: {
  after: ComparePhoto | null;
  before: ComparePhoto | null;
  frame: FrameSize;
  position: number;
}): React.JSX.Element {
  if (!props.before || !props.after) {
    const photo = props.before ?? props.after;
    return (
      <Image
        accessibilityIgnoresInvertColors
        resizeMode={'contain'}
        source={{ uri: photo?.imageUrl }}
        style={styles.photo}
      />
    );
  }
  return (
    <>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode={'contain'}
        source={{ uri: props.after.imageUrl }}
        style={styles.photo}
      />
      <View style={[styles.clip, { width: clipWidth(props.frame.width, props.position) }]}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode={'contain'}
          source={{ uri: props.before.imageUrl }}
          style={{ height: props.frame.height, width: props.frame.width }}
        />
      </View>
    </>
  );
}

function RevealChrome(props: { position: number; t: Translate }): React.JSX.Element {
  return (
    <>
      <View pointerEvents={'none'} style={styles.badgeLeft}>
        <Text style={styles.badgeText}>{props.t('coach.compare.before')}</Text>
      </View>
      <View pointerEvents={'none'} style={styles.badgeRight}>
        <Text style={styles.badgeText}>{props.t('coach.compare.after')}</Text>
      </View>
      <View pointerEvents={'none'} style={[styles.handle, { left: `${props.position}%` }]}>
        <View style={styles.line} />
        <View style={styles.knob} />
      </View>
    </>
  );
}

function readPosition(value: string): number {
  const next = Number(value);
  if (!Number.isFinite(next)) return START;
  return Math.min(100, Math.max(0, next));
}

function clipWidth(width: number, position: number): number {
  return Math.round((width * position) / 100);
}

const rangeStyle: React.CSSProperties = {
  cursor: 'ew-resize',
  height: '100%',
  left: 0,
  margin: 0,
  opacity: 0,
  position: 'absolute',
  top: 0,
  width: '100%',
  zIndex: 3,
};

const styles = StyleSheet.create({
  badgeLeft: {
    backgroundColor: colors.imageOverlay,
    borderRadius: radius.sm,
    left: space.sm,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    position: 'absolute',
    top: space.sm,
    zIndex: 2,
  },
  badgeRight: {
    backgroundColor: colors.imageOverlay,
    borderRadius: radius.sm,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    position: 'absolute',
    right: space.sm,
    top: space.sm,
    zIndex: 2,
  },
  badgeText: { color: colors.textInverse, fontSize: fontSize.xs, fontWeight: '700' },
  block: { alignItems: 'center', gap: space.sm, width: '100%' },
  caption: { color: colors.textMuted, fontSize: fontSize.sm },
  clip: { bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', top: 0 },
  frame: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    maxWidth: 460,
    overflow: 'hidden',
    width: '100%',
  },
  handle: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    marginLeft: -14,
    position: 'absolute',
    top: 0,
    width: 28,
    zIndex: 2,
  },
  knob: {
    backgroundColor: colors.surface,
    borderColor: colors.chartTeal,
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    width: 28,
  },
  line: { backgroundColor: colors.chartTeal, bottom: 0, position: 'absolute', top: 0, width: 2 },
  note: { color: colors.textMuted, fontSize: fontSize.sm, padding: space.md },
  photo: { height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' },
});
