import React from 'react';
import { Text, View } from 'react-native';
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
  return (
    <View style={[s.card, { marginTop: 24 }]}>
      <Text style={s.label}>{t('coach.routine.list.title')}</Text>
      {templates.length === 0 ? (
        <Text style={s.emptyDay}>{t('coach.routine.list.empty')}</Text>
      ) : (
        templates.map((tpl) => (
          <View key={tpl.id} style={s.templateItem}>
            <RoutineListItem onDelete={onDelete} onLoad={onLoad} t={t} tpl={tpl} />
          </View>
        ))
      )}
    </View>
  );
}
