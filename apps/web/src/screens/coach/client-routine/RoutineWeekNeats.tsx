import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, space } from '@trainerpro/ui';
import type { RoutineEditorNeat } from '@trainerpro/shared';
import { NeatSection } from '../components/RoutinePlanner/NeatSection';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  closed: boolean;
  neats: RoutineEditorNeat[];
  onSave: (neats: Array<{ description?: string; id?: string; title: string }>) => void;
  readOnly: boolean;
  t: (key: string) => string;
};

/** NEAT of one week. Items the coach just added have a local id, so only real ids are sent back. */
export function RoutineWeekNeats(props: Props): React.JSX.Element {
  return (
    <View style={styles.box}>
      <NeatSection
        isReadOnly={props.readOnly}
        neats={props.neats}
        onChange={(next) =>
          props.onSave(
            next.map((neat) => ({
              description: neat.description ?? '',
              ...(UUID.test(neat.id) ? { id: neat.id } : {}),
              title: neat.title,
            })),
          )
        }
        t={props.t}
      />
      <Text style={styles.note}>
        {props.t(props.closed ? 'coach.clientRoutine.neat.closed' : 'coach.clientRoutine.neat.note')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: space.sm },
  note: { color: colors.textMuted, fontSize: fontSize.xs },
});
