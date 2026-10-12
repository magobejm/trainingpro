import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { callTimeOptions } from './calendar-fixed-colors';

const TEXT_LIGHT = '#f8fafc';

type Props = {
  onChange: (time: string) => void;
  value: string;
};

export function CallTimeSelect(props: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable accessibilityRole={'button'} onPress={() => setOpen((current) => !current)} style={styles.trigger}>
        <Text style={styles.triggerText}>{props.value}</Text>
      </Pressable>
      {open ? <TimeOptions onChange={props.onChange} onClose={() => setOpen(false)} value={props.value} /> : null}
    </View>
  );
}

function TimeOptions(props: Props & { onClose: () => void }): React.JSX.Element {
  return (
    <ScrollView nestedScrollEnabled style={styles.list}>
      {callTimeOptions().map((option) => (
        <Pressable
          accessibilityRole={'button'}
          key={option}
          onPress={() => {
            props.onChange(option);
            props.onClose();
          }}
          style={option === props.value ? styles.optionSelected : styles.option}
        >
          <Text style={styles.optionText}>{option}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 160, marginTop: 6 },
  option: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  optionSelected: { backgroundColor: '#ffffff22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  optionText: { color: TEXT_LIGHT, fontSize: 14 },
  trigger: { backgroundColor: '#ffffff22', borderRadius: 8, marginTop: 8, paddingHorizontal: 10, paddingVertical: 8 },
  triggerText: { color: TEXT_LIGHT, fontSize: 14, fontWeight: '700' },
});
