import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, space } from '@trainerpro/ui';
import { setVariablesForType, type RoutineEditorItemKind, type SetVariableKey } from '@trainerpro/shared';
import { VariableHint } from '../components/VariableHint';
import { columnWidth, ValueCell } from './ClientSeriesValue';

type Translate = (key: string) => string;

/** A prescribed set of any kind of item. Variables the kind lacks are simply absent. */
export type GridSet = {
  advancedTechnique: null | string;
  fcMaxPctMax?: null | number;
  fcReservePctMax?: null | number;
  heartRateMax?: null | number;
  id: string;
  logged?: Partial<Record<SetVariableKey, null | number>> | null;
  note: null | string;
  setIndex: number;
} & Partial<Record<SetVariableKey, null | number | string>>;

export type SetPatch = Record<string, null | number | string>;

const INDEX = 44;
const ACTIONS = 72;
const LOCK_ON = '🔒';
const LOCK_OFF = '🔓';
const NOTE_ICON = '📝';
const TRASH_ICON = '🗑';

export type ClientSeriesTableProps = {
  advancedOn: boolean;
  editable: boolean;
  kind: RoutineEditorItemKind;
  lockedFields: string[];
  onAdd: () => void;
  onOpenAdvanced: (set: GridSet) => void;
  onOpenNote: (set: GridSet) => void;
  onPatch: (setId: string, patch: SetPatch) => void;
  onRemove: (setId: string) => void;
  onToggleLock: (variable: SetVariableKey) => void;
  sets: GridSet[];
  t: Translate;
};

function RowActions(props: {
  editable: boolean;
  onNote: () => void;
  onRemove: () => void;
  set: GridSet;
  single: boolean;
  t: Translate;
}) {
  const hasNote = Boolean(props.set.note);
  return (
    <View style={styles.actions}>
      {props.editable || hasNote ? (
        <TouchableOpacity accessibilityLabel={NOTE_ICON} onPress={props.onNote}>
          <Text style={[styles.icon, hasNote ? styles.iconActive : styles.iconIdle]}>{NOTE_ICON}</Text>
        </TouchableOpacity>
      ) : null}
      {props.editable && !props.single ? (
        <TouchableOpacity accessibilityLabel={props.t('coach.clientRoutine.removeThisSet')} onPress={props.onRemove}>
          <Text style={styles.remove}>{TRASH_ICON}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function IndexCell(props: { advancedOn: boolean; onPress: () => void; set: GridSet }): React.JSX.Element {
  const technique = Boolean(props.set.advancedTechnique);
  const body = <Text style={[styles.indexNumber, technique && styles.indexAdvanced]}>{props.set.setIndex + 1}</Text>;
  const pressable = props.advancedOn || technique;
  return (
    <View style={styles.indexCell}>
      {pressable ? <TouchableOpacity onPress={props.onPress}>{body}</TouchableOpacity> : body}
    </View>
  );
}

function tableWidth(keys: SetVariableKey[]): number {
  return INDEX + ACTIONS + keys.reduce((sum, key) => sum + columnWidth(key), 0) + (keys.length + 1) * space.sm;
}

export function ClientSeriesTable(props: ClientSeriesTableProps): React.JSX.Element {
  const variables = setVariablesForType(props.kind === 'exercise' ? 'strength' : props.kind);
  const label = (key: SetVariableKey) => props.t(`coach.clientRoutine.var.${key}`);
  const dash = props.t('coach.routine.seriesTable.placeholderDash');
  return (
    <View style={styles.frame}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={[styles.grid, { width: tableWidth(variables) }]}>
          <View style={styles.row}>
            <VariableHint id={'set'} style={styles.index}>
              <Text style={styles.index}>{props.t('coach.clientRoutine.set')}</Text>
            </VariableHint>
            {variables.map((key) => (
              <View key={key} style={[styles.headCell, { width: columnWidth(key) }]}>
                <VariableHint id={key} style={styles.headHint}>
                  <Text style={styles.head}>{label(key)}</Text>
                </VariableHint>
                {props.editable ? (
                  <TouchableOpacity
                    accessibilityLabel={props.t('coach.clientRoutine.lockColumn')}
                    onPress={() => props.onToggleLock(key)}
                  >
                    <Text style={styles.lock}>{props.lockedFields.includes(key) ? LOCK_ON : LOCK_OFF}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
            <View style={styles.actions} />
          </View>
          {props.sets.map((set) => (
            <View key={set.id} style={styles.row}>
              <IndexCell advancedOn={props.advancedOn} onPress={() => props.onOpenAdvanced(set)} set={set} />
              {variables.map((key) => (
                <ValueCell
                  editable={props.editable}
                  key={key}
                  label={label(key)}
                  locked={props.lockedFields.includes(key)}
                  logged={set.logged?.[key]}
                  onPatch={(patch) => props.onPatch(set.id, patch)}
                  placeholder={dash}
                  set={set}
                  t={props.t}
                  variable={key}
                />
              ))}
              <RowActions
                editable={props.editable}
                onNote={() => props.onOpenNote(set)}
                onRemove={() => props.onRemove(set.id)}
                set={set}
                single={props.sets.length <= 1}
                t={props.t}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space.sm,
    justifyContent: 'flex-end',
    minHeight: 28,
    width: ACTIONS,
  },
  grid: { gap: space.xs },
  head: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', textAlign: 'center' },
  headHint: { alignItems: 'center', maxWidth: '100%', width: '100%' },
  headCell: { alignItems: 'center', gap: 2 },
  icon: { fontSize: fontSize.sm },
  iconActive: { opacity: 1 },
  iconIdle: { opacity: 0.45 },
  index: { color: colors.textMuted, fontSize: fontSize.xs, paddingTop: space.xs, textAlign: 'center', width: 44 },
  indexCell: { alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center', width: 44 },
  indexNumber: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center' },
  indexAdvanced: { color: colors.danger, fontWeight: '700' },
  lock: { fontSize: fontSize.xs },
  remove: { color: colors.danger, fontSize: fontSize.sm },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: space.sm },
  frame: { maxWidth: '100%', overflow: 'hidden', width: '100%' },
});
