import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { SearchBar } from '@trainerpro/ui';
import { s } from '../../RoutinePlanner.styles';
import type { RoutineTemplateView } from '../../../../data/hooks/useRoutineTemplates';
import { RoutineListItem } from './RoutineListItem';

interface RoutineListProps {
  templates: RoutineTemplateView[];
  onLoad: (tpl: RoutineTemplateView) => void;
  onDelete: (id: string) => void;
  t: (k: string) => string;
}

export function RoutineList({ templates, onLoad, onDelete, t }: RoutineListProps) {
  const [query, setQuery] = useState('');
  const filtered = useFilteredTemplates(templates, query);
  return (
    <View style={[s.card, { marginTop: 24 }]}>
      <Text style={s.label}>{t('coach.routine.list.title')}</Text>
      <SearchBar
        onChangeText={setQuery}
        placeholder={t('coach.routine.list.searchPlaceholder')}
        value={query}
      />
      {filtered.length === 0 ? (
        <Text style={s.emptyDay}>{t('coach.routine.list.empty')}</Text>
      ) : (
        filtered.map((tpl) => (
          <View key={tpl.id} style={s.templateItem}>
            <RoutineListItem onDelete={onDelete} onLoad={onLoad} t={t} tpl={tpl} />
          </View>
        ))
      )}
    </View>
  );
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
