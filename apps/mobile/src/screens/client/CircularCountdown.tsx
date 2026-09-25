import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { LIGHT } from '../../theme/light';
import { circularProgressOffset, circularRingMetrics } from './circular-countdown.utils';
import { formatRestLabel } from './session-completion.utils';

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
  const fontSize = size >= 160 ? 40 : size >= 72 ? 16 : 12;

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
      <Text style={[styles.label, { fontSize }]}>{formatRestLabel(remaining)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: LIGHT.textStrong,
    fontWeight: '800',
    position: 'absolute',
    textAlign: 'center',
  },
});
