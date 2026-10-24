import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { ProgressPose } from './client-measures.helpers';

const STROKE = 'rgba(255,255,255,0.88)';
const FRONT_BODY =
  'M46 78 C24 98 22 140 34 176 L46 292 L62 292 L68 188 L82 188 L88 292 L104 292 L116 176 C128 140 126 98 104 78 Z';
const SIDE_BODY = 'M78 78 C108 100 114 146 102 186 L92 292 L74 292 L82 188 C64 140 66 100 74 78';
const BACK_SPINE = 'M75 84 L75 186';

type Props = { pose: ProgressPose };

export function ProgressPhotoSilhouette(props: Props): React.JSX.Element {
  return (
    <View pointerEvents={'none'} style={styles.frame}>
      <Svg height={'100%'} viewBox={'0 0 150 320'} width={'100%'}>
        <Circle cx={headX(props.pose)} cy={46} fill={'none'} r={24} stroke={STROKE} strokeWidth={3} />
        <Path d={bodyPath(props.pose)} fill={'none'} stroke={STROKE} strokeWidth={3} />
        {props.pose === 'back' ? <Path d={BACK_SPINE} fill={'none'} stroke={STROKE} strokeWidth={3} /> : null}
      </Svg>
    </View>
  );
}

function headX(pose: ProgressPose): number {
  return pose === 'side' ? 92 : 75;
}

function bodyPath(pose: ProgressPose): string {
  return pose === 'side' ? SIDE_BODY : FRONT_BODY;
}

const styles = StyleSheet.create({
  frame: { height: '78%', width: '70%' },
});
