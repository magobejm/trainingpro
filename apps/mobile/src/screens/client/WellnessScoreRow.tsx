import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { LIGHT } from '../../theme/light';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function WellnessScoreRow({ label, onChange, value }: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{String(value)}</Text>
      </View>
      <Slider
        maximumTrackTintColor={LIGHT.borderStrong}
        maximumValue={10}
        minimumTrackTintColor={LIGHT.accent}
        minimumValue={1}
        onValueChange={onChange}
        step={1}
        thumbTintColor={LIGHT.accent}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: LIGHT.textMuted, flex: 1, fontSize: 13, fontWeight: '600', paddingRight: 8 },
  row: { gap: 4 },
  value: { color: LIGHT.textStrong, fontSize: 18, fontWeight: '800' },
});
