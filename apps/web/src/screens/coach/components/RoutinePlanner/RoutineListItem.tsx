import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { RoutineTemplateView } from '../../../../data/hooks/useRoutineTemplates';

interface RoutineListItemProps {
  tpl: RoutineTemplateView;
  onLoad: (tpl: RoutineTemplateView) => void;
  onDelete: (id: string) => void;
  t: (k: string, options?: { count: number }) => string;
}

export function RoutineListItem({ tpl, onLoad, onDelete, t }: RoutineListItemProps) {
  const isGlobal = (tpl as { scope?: string }).scope === 'GLOBAL';
  return (
    <>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={s.templateName}>{tpl.name}</Text>
          {isGlobal && (
            <Text style={[s.templateBadge, s.templateBadgeGlobal]}>{t('common.global')}</Text>
          )}
        </View>
        <Text style={s.templateMeta}>
          {t('coach.routine.list.days', { count: tpl.days.length })}
        </Text>
      </View>
      <View style={s.templateActions}>
        <Pressable onPress={() => onLoad(tpl)} style={s.editBtn}>
          <Text style={s.editBtnText}>
            {isGlobal ? t('common.view') : t('coach.routine.list.edit')}
          </Text>
        </Pressable>
        {!isGlobal && (
          <Pressable onPress={() => onDelete(tpl.id)} style={s.deleteBtn}>
            <Text style={s.deleteBtnText}>{t('coach.routine.list.delete')}</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}
