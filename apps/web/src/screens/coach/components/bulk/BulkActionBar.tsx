import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '@trainerpro/ui';
import type { Translate } from './BulkActionFields';
import type { BulkKind } from './BulkActionModal';
import { bulkStyles as styles } from './bulk.styles';

export const MAX_BULK = 100;
const KINDS: BulkKind[] = ['assignRoutine', 'assignNutritionPlan', 'scheduleTest', 'broadcastMessage'];

type Props = { count: number; onCancel: () => void; onPick: (kind: BulkKind) => void; t: Translate };

export function BulkActionBar(props: Props): React.JSX.Element | null {
  if (props.count === 0) return null;
  const tooMany = props.count > MAX_BULK;
  return (
    <View style={styles.bar}>
      <Text style={styles.barCount}>{props.t('coach.bulk.selected', { count: props.count })}</Text>
      {tooMany ? <Text style={styles.hint}>{props.t('coach.bulk.tooMany', { max: MAX_BULK })}</Text> : null}
      {KINDS.map((kind) => (
        <Button
          disabled={tooMany}
          key={kind}
          label={props.t(`coach.bulk.kind.${kind}`)}
          onPress={() => props.onPick(kind)}
          size="sm"
        />
      ))}
      <Button label={props.t('coach.bulk.cancel')} onPress={props.onCancel} size="sm" variant="ghost" />
    </View>
  );
}
