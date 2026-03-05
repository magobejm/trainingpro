import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SearchBar } from '@trainerpro/ui';
import { s } from '../../RoutinePlanner.styles';
import type { RoutineTemplateView } from '../../../../data/hooks/useRoutineTemplates';
import { RoutineListItem } from './RoutineListItem';

interface RoutineListProps {
  clientContextId?: null | string;
  clientContextName?: null | string;
  onAssignTemplate?: (templateId: string) => Promise<void>;
  templates: RoutineTemplateView[];
  onLoad: (tpl: RoutineTemplateView) => void;
  onDelete: (id: string) => void;
  t: (k: string, options?: Record<string, unknown>) => string;
}

export function RoutineList({
  clientContextId,
  clientContextName,
  onAssignTemplate,
  templates,
  onLoad,
  onDelete,
  t,
}: RoutineListProps) {
  const [query, setQuery] = useState('');
  const filtered = useFilteredTemplates(templates, query);
  const vm = {
    clientContextId,
    clientContextName,
    filtered,
    onAssignTemplate,
    onDelete,
    onLoad,
    query,
    setQuery,
    t,
  };
  return <RoutineListView {...vm} />;
}

function RoutineListView(
  props: Pick<
    RoutineListProps,
    'clientContextId' | 'clientContextName' | 'onAssignTemplate' | 'onDelete' | 'onLoad' | 't'
  > & {
    filtered: RoutineTemplateView[];
    query: string;
    setQuery: (value: string) => void;
  },
) {
  const listContent = renderListContent(props);
  return (
    <View style={[s.card, { marginTop: 24 }]}>
      <Text style={s.label}>{props.t('coach.routine.list.title')}</Text>
      <SearchBar
        onChangeText={props.setQuery}
        placeholder={props.t('coach.routine.list.searchPlaceholder')}
        value={props.query}
      />
      {listContent}
    </View>
  );
}

function renderListContent(
  props: Pick<
    RoutineListProps,
    'clientContextId' | 'clientContextName' | 'onAssignTemplate' | 'onDelete' | 'onLoad' | 't'
  > & {
    filtered: RoutineTemplateView[];
  },
) {
  if (props.filtered.length === 0) {
    return <Text style={s.emptyDay}>{props.t('coach.routine.list.empty')}</Text>;
  }
  return props.filtered.map((tpl) => (
    <View key={tpl.id} style={s.templateItem}>
      <RoutineListItem
        clientContextId={props.clientContextId}
        clientContextName={props.clientContextName}
        onAssignTemplate={props.onAssignTemplate}
        onDelete={props.onDelete}
        onLoad={props.onLoad}
        t={props.t}
        tpl={tpl}
      />
    </View>
  ));
}

function useFilteredTemplates(
  templates: RoutineTemplateView[],
  query: string,
): RoutineTemplateView[] {
  return useMemo(() => {
    const sorted = [...templates].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
    );
    const q = query.trim().toLowerCase();
    if (!q) {
      return sorted;
    }
    return sorted.filter((tpl) => tpl.name.toLowerCase().includes(q));
  }, [query, templates]);
}
