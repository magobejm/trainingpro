import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { LIGHT } from '../../theme/light';
import {
  circularProgressOffset,
  circularRingMetrics,
  countdownFaceFontSize,
  countdownFaceParts,
} from './circular-countdown.utils';

type CircularCountdownProps = {
  remaining: number;
  size: number;
  strokeWidth: number;
  totalSeconds: number;
};

export function CircularCountdown(props: CircularCountdownProps): React.JSX.Element {
  const { remaining, size, strokeWidth, totalSeconds } = props;
  const { circumference, cx, cy, radius } = circularRingMetrics(size, strokeWidth);
  const offset = circularProgressOffset(remaining, totalSeconds, circumference);
  const parts = countdownFaceParts(size, remaining);
  const fontSize = countdownFaceFontSize(parts.length);

  return (
    <View style={[styles.wrap, { height: size, width: size }]}>
      <Svg height={size} width={size}>
        <Circle cx={cx} cy={cy} fill={'none'} r={radius} stroke={LIGHT.emeraldSoft} strokeWidth={strokeWidth} />
        <G transform={`rotate(-90 ${cx} ${cy})`}>
          <Circle
            cx={cx}
            cy={cy}
            fill={'none'}
            r={radius}
            stroke={LIGHT.emerald}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap={'round'}
            strokeWidth={strokeWidth}
          />
        </G>
      </Svg>
      {parts.length > 0 ? (
        <View style={[styles.face, { padding: strokeWidth + 8 }]}>
          {parts.map((part) => (
            <Text key={part.unit} numberOfLines={1} style={[styles.line, { fontSize }]}>
              {`${part.value} ${part.unit}`}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  line: {
    color: LIGHT.textStrong,
    fontWeight: '800',
    textAlign: 'center',
  },
});
