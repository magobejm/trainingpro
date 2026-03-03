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
  onShowDetail?: () => void;
  readOnly?: boolean;
}

const ICON_DETAIL = '🔍';
const ICON_REMOVE = '✕';

export function BlockActions(props: BlockActionsProps) {
  return (
    <View style={s.blockActions}>
      {props.onShowDetail && (
        <ActionButton label={ICON_DETAIL} onPress={props.onShowDetail} testID="view-details" />
      )}
      {!props.readOnly && (
        <ActionButton isRemove label={ICON_REMOVE} onPress={props.onRemove} testID="remove-block" />
      )}
    </View>
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
      style={isRemove ? s.removeBtn : s.viewDetailBtn}
    >
      <Text style={isRemove ? s.removeBtnText : s.viewDetailBtnText}>{label}</Text>
    </Pressable>
  );
}
