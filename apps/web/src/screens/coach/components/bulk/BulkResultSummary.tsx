import React from 'react';
import { Text, View } from 'react-native';
import { Badge, Button } from '@trainerpro/ui';
import type { BulkResult } from '../../../../data/hooks/useBulkClients';
import type { Translate } from './BulkActionFields';
import { bulkStyles as styles } from './bulk.styles';

type Props = {
  names: Record<string, string>;
  onRetry: (clientIds: string[]) => void;
  result: BulkResult;
  retrying: boolean;
  t: Translate;
};

export function BulkResultSummary(props: Props): React.JSX.Element {
  const failed = props.result.results.filter((row) => row.status === 'error');
  const okCount = props.result.results.length - failed.length;
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryHead}>{props.t('coach.bulk.totals', { errors: failed.length, ok: okCount })}</Text>
      <View style={styles.summaryList}>
        {props.result.results.map((row) => (
          <View key={row.clientId} style={styles.summaryRow}>
            <View style={styles.summaryText}>
              <Text style={styles.summaryName}>{props.names[row.clientId] ?? row.clientId}</Text>
              {row.status === 'error' && row.message ? <Text style={styles.summaryNote}>{row.message}</Text> : null}
            </View>
            <Badge
              label={props.t(row.status === 'ok' ? 'coach.bulk.ok' : 'coach.bulk.error')}
              tone={row.status === 'ok' ? 'success' : 'danger'}
            />
          </View>
        ))}
      </View>
      {failed.length > 0 ? (
        <Button
          disabled={props.retrying}
          label={props.t('coach.bulk.retry')}
          onPress={() => props.onRetry(failed.map((row) => row.clientId))}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}
