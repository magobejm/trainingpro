import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Select, TextField } from '@trainerpro/ui';
import type { BulkAction } from '../../../../data/hooks/useBulkClients';
import { useNutritionPlansQuery } from '../../../../data/hooks/useNutrition';
import { usePhysicalTestsCatalogQuery } from '../../../../data/hooks/usePhysicalTests';
import { useRoutineTemplatesQuery } from '../../../../data/hooks/useRoutineTemplates';
import { bulkStyles as styles } from './bulk.styles';

export type Translate = (key: string, options?: Record<string, unknown>) => string;
type FieldProps = { onChange: (action: BulkAction | null) => void; t: Translate };

export function RoutineFields(props: FieldProps): React.JSX.Element {
  const query = useRoutineTemplatesQuery({ summary: true });
  const options = (query.data ?? []).map((item) => ({ label: item.name, value: item.id }));
  return (
    <PickField
      emptyLabel={props.t('coach.bulk.pickEmpty')}
      label={props.t('coach.bulk.routine')}
      onPick={(id) => props.onChange(id ? { action: 'assignRoutine', templateId: id } : null)}
      options={options}
      t={props.t}
    />
  );
}

export function NutritionFields(props: FieldProps): React.JSX.Element {
  const query = useNutritionPlansQuery();
  const options = (query.data ?? []).map((item) => ({ label: item.name, value: item.id }));
  return (
    <PickField
      emptyLabel={props.t('coach.bulk.pickEmpty')}
      label={props.t('coach.bulk.nutrition')}
      onPick={(id) => props.onChange(id ? { action: 'assignNutritionPlan', planId: id } : null)}
      options={options}
      t={props.t}
    />
  );
}

export function TestFields(props: FieldProps): React.JSX.Element {
  const query = usePhysicalTestsCatalogQuery();
  const [testId, setTestId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const options = (query.data ?? []).map((item) => ({ label: item.name, value: item.id }));
  useEffect(() => {
    const valid = testId && /^\d{4}-\d{2}-\d{2}$/.test(date);
    props.onChange(valid ? { action: 'scheduleTest', date, physicalTestId: testId } : null);
  }, [date, testId]);
  return (
    <>
      <Select
        label={props.t('coach.bulk.test')}
        onChange={setTestId}
        options={[{ label: props.t('coach.bulk.pickEmpty'), value: '' }, ...options]}
        value={testId}
      />
      <TextField label={props.t('coach.bulk.date')} onChangeText={setDate} placeholder={'YYYY-MM-DD'} value={date} />
    </>
  );
}

export function MessageFields(props: FieldProps): React.JSX.Element {
  const [message, setMessage] = useState(props.t('coach.bulk.sample'));
  useEffect(() => {
    const text = message.trim();
    props.onChange(text ? { action: 'broadcastMessage', message: text } : null);
  }, [message]);
  return (
    <>
      <TextField label={props.t('coach.bulk.message')} multiline onChangeText={setMessage} value={message} />
      <Text style={styles.hint}>{props.t('coach.bulk.hint')}</Text>
    </>
  );
}

function PickField(props: {
  emptyLabel: string;
  label: string;
  onPick: (id: string) => void;
  options: Array<{ label: string; value: string }>;
  t: Translate;
}): React.JSX.Element {
  const [value, setValue] = useState('');
  return (
    <Select
      label={props.label}
      onChange={(next) => {
        setValue(next);
        props.onPick(next);
      }}
      options={[{ label: props.emptyLabel, value: '' }, ...props.options]}
      value={value}
    />
  );
}
