import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';

interface BlockActionsProps {
  isFirst: boolean;
  isLast: boolean;
  daysCount: number;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
  onShowMove: () => void;
}

export function BlockActions(props: BlockActionsProps) {
  return (
    <View style={s.blockActions}>
      <MoveButtons props={props} />
      {props.daysCount > 1 && (
        <ActionButton label={'\u21c6'} onPress={props.onShowMove} testID="move-to-another-day" />
      )}
      <ActionButton isRemove label={'\u2715'} onPress={props.onRemove} testID="remove-block" />
    </View>
  );
}

function MoveButtons({ props }: { props: BlockActionsProps }) {
  return (
    <>
      {!props.isFirst && (
        <ActionButton label={'\u2191'} onPress={() => props.onMove(-1)} testID="move-up" />
      )}
      {!props.isLast && (
        <ActionButton label={'\u2193'} onPress={() => props.onMove(1)} testID="move-down" />
      )}
    </>
  );
}

interface ActionBtnProps {
  label: string;
  onPress: () => void;
  testID: string;
  isRemove?: boolean;
}

function ActionButton({ label, onPress, testID, isRemove }: ActionBtnProps) {
  return (
    <Pressable
      accessibilityLabel={testID}
      onPress={onPress}
      style={isRemove ? s.removeBtn : s.moveBtn}
    >
      <Text style={s.moveBtnText}>{label}</Text>
    </Pressable>
  );
}
