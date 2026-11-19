import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, colors, fontSize, radius, space } from '@trainerpro/ui';
import type { RoutineEditorDay, RoutineEditorItemKind } from '@trainerpro/shared';

type Translate = (key: string, options?: Record<string, number | string>) => string;
export type GroupType = 'CIRCUIT' | 'SUPERSET';
export type GroupMember = { id: string; kind: RoutineEditorItemKind };
export type OnGroup = (dayId: string, items: GroupMember[], groupType: GroupType | null) => void;

/** Starts a superset or circuit by letting the coach pick the exercise cards, as in the prototype. */
export function DayGrouping(props: {
  day: RoutineEditorDay;
  mode: GroupType | null;
  onCancel: () => void;
  onConfirm: () => void;
  onStart: (type: GroupType) => void;
  selectedCount: number;
  t: Translate;
}): React.JSX.Element | null {
  const { mode, onCancel, onConfirm, onStart, selectedCount, t } = props;
  if (props.day.exercises.length + props.day.blocks.length < 2) return null;
  if (!mode) {
    return (
      <View style={styles.row}>
        <Button
          label={t('coach.clientRoutine.group.addSuperset')}
          onPress={() => onStart('SUPERSET')}
          size="sm"
          variant="secondary"
        />
        <Button
          label={t('coach.clientRoutine.group.addCircuit')}
          onPress={() => onStart('CIRCUIT')}
          size="sm"
          variant="secondary"
        />
      </View>
    );
  }
  const label = t(`coach.clientRoutine.group.${mode}`);
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{t('coach.clientRoutine.group.select', { count: selectedCount, label })}</Text>
      <View style={styles.row}>
        <Button label={t('common.cancel')} onPress={onCancel} size="sm" variant="secondary" />
        <Button disabled={selectedCount < 2} label={t('coach.clientRoutine.group.confirm')} onPress={onConfirm} size="sm" />
      </View>
    </View>
  );
}

/** Blue frame around a finished superset or circuit, with the prototype's ungroup action. */
export function GroupFrame(props: {
  children: React.ReactNode;
  count: number;
  editable: boolean;
  label: string;
  onUngroup: () => void;
  t: Translate;
}): React.JSX.Element {
  return (
    <View style={styles.frame}>
      <View style={styles.frameHead}>
        <Text style={styles.frameTitle}>{props.label}</Text>
        <Text style={styles.frameCount}>{props.t('coach.clientRoutine.group.groupedCount', { count: props.count })}</Text>
        {props.editable ? (
          <Button
            label={props.t('coach.clientRoutine.group.ungroupAction')}
            onPress={props.onUngroup}
            size="sm"
            variant="secondary"
          />
        ) : null}
      </View>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.sm,
    padding: space.sm,
  },
  bannerText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  frame: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: space.sm,
    padding: space.sm,
  },
  frameCount: { color: colors.primary, flexGrow: 1, fontSize: fontSize.xs },
  frameHead: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  frameTitle: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
