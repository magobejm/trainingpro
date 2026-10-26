import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Modal } from '@trainerpro/ui';
import { useBulkClientsMutation, type BulkAction, type BulkResult } from '../../../../data/hooks/useBulkClients';
import { MessageFields, NutritionFields, RoutineFields, TestFields, type Translate } from './BulkActionFields';
import { BulkResultSummary } from './BulkResultSummary';
import { bulkStyles as styles } from './bulk.styles';

export type BulkKind = 'assignNutritionPlan' | 'assignRoutine' | 'broadcastMessage' | 'scheduleTest';

type Props = {
  clientIds: string[];
  kind: BulkKind;
  names: Record<string, string>;
  onClose: () => void;
  t: Translate;
};

const FIELDS = {
  assignNutritionPlan: NutritionFields,
  assignRoutine: RoutineFields,
  broadcastMessage: MessageFields,
  scheduleTest: TestFields,
} as const;

export function BulkActionModal(props: Props): React.JSX.Element {
  const [action, setAction] = useState<BulkAction | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const mutation = useBulkClientsMutation();
  const Fields = FIELDS[props.kind];
  const run = (clientIds: string[]) => {
    if (!action) return;
    mutation.mutate({ action, clientIds }, { onSuccess: (data) => setResult((prev) => mergeResults(prev, data)) });
  };
  const footer = result ? (
    <Button label={props.t('coach.bulk.done')} onPress={props.onClose} />
  ) : (
    <View style={styles.actions}>
      <Button label={props.t('coach.bulk.cancel')} onPress={props.onClose} variant="ghost" />
      <Button
        disabled={!action || mutation.isPending}
        label={props.t('coach.bulk.apply', { count: props.clientIds.length })}
        onPress={() => run(props.clientIds)}
      />
    </View>
  );
  return (
    <Modal
      closeLabel={props.t('coach.bulk.cancel')}
      footer={footer}
      onClose={props.onClose}
      title={props.t(`coach.bulk.kind.${props.kind}`)}
      visible
    >
      <View style={styles.body}>
        {result ? (
          <BulkResultSummary names={props.names} onRetry={run} result={result} retrying={mutation.isPending} t={props.t} />
        ) : (
          <Fields onChange={setAction} t={props.t} />
        )}
      </View>
    </Modal>
  );
}

function mergeResults(previous: BulkResult | null, next: BulkResult): BulkResult {
  if (!previous) return next;
  const updated = new Map(next.results.map((row) => [row.clientId, row]));
  return { results: previous.results.map((row) => updated.get(row.clientId) ?? row) };
}
