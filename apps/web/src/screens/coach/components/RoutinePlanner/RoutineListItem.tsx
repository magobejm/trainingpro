import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { RoutineTemplateView } from '../../../../data/hooks/useRoutineTemplates';

interface RoutineListItemProps {
  clientContextId?: null | string;
  clientContextName?: null | string;
  onAssignTemplate?: (templateId: string) => Promise<void>;
  tpl: RoutineTemplateView;
  onLoad: (tpl: RoutineTemplateView) => void;
  onDelete: (id: string) => void;
  t: (k: string, options?: Record<string, unknown>) => string;
}

export function RoutineListItem({
  clientContextId,
  clientContextName,
  onAssignTemplate,
  tpl,
  onLoad,
  onDelete,
  t,
}: RoutineListItemProps) {
  const isGlobal = (tpl as { scope?: string }).scope === 'GLOBAL';
  const isAssigned = Boolean(tpl.isAssigned || (tpl.assignedClientsCount ?? 0) > 0);
  const canAssign = Boolean(clientContextId && onAssignTemplate);
  return (
    <>
      <TemplateInfo isAssigned={isAssigned} isGlobal={isGlobal} t={t} tpl={tpl} />
      <TemplateActions
        canAssign={canAssign}
        clientContextName={clientContextName}
        isAssigned={isAssigned}
        isGlobal={isGlobal}
        onAssignTemplate={onAssignTemplate}
        onDelete={onDelete}
        onLoad={onLoad}
        t={t}
        tpl={tpl}
      />
    </>
  );
}

function TemplateInfo(props: {
  isAssigned: boolean;
  isGlobal: boolean;
  t: (k: string, options?: Record<string, unknown>) => string;
  tpl: RoutineTemplateView;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={s.templateName}>{props.tpl.name}</Text>
        {props.isGlobal && (
          <Text style={[s.templateBadge, s.templateBadgeGlobal]}>{props.t('common.global')}</Text>
        )}
        {props.isAssigned && (
          <Text style={[s.templateBadge, s.templateBadgeGlobal]}>
            {props.t('coach.routine.list.inUse')}
          </Text>
        )}
      </View>
      <Text style={s.templateMeta}>
        {props.t('coach.routine.list.days', { count: props.tpl.days.length })}
      </Text>
    </View>
  );
}

function TemplateActions(props: {
  canAssign: boolean;
  clientContextName?: null | string;
  isAssigned: boolean;
  isGlobal: boolean;
  onAssignTemplate?: (templateId: string) => Promise<void>;
  onDelete: (id: string) => void;
  onLoad: (tpl: RoutineTemplateView) => void;
  t: (k: string, options?: Record<string, unknown>) => string;
  tpl: RoutineTemplateView;
}) {
  return (
    <View style={s.templateActions}>
      {props.canAssign && (
        <Pressable onPress={() => void props.onAssignTemplate?.(props.tpl.id)} style={s.editBtn}>
          <Text style={s.editBtnText}>{resolveAssignLabel(props.clientContextName, props.t)}</Text>
        </Pressable>
      )}
      <LoadButton isGlobal={props.isGlobal} onLoad={props.onLoad} t={props.t} tpl={props.tpl} />
      {!props.isGlobal && !props.isAssigned && (
        <Pressable onPress={() => props.onDelete(props.tpl.id)} style={s.deleteBtn}>
          <Text style={s.deleteBtnText}>{props.t('coach.routine.list.delete')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function resolveAssignLabel(
  clientContextName: null | string | undefined,
  t: (k: string, options?: Record<string, unknown>) => string,
): string {
  if (clientContextName?.trim()) {
    return t('coach.routine.assignForClient', { client: clientContextName.trim() });
  }
  return t('common.assign');
}

function LoadButton(props: {
  isGlobal: boolean;
  onLoad: (tpl: RoutineTemplateView) => void;
  t: (k: string, options?: Record<string, unknown>) => string;
  tpl: RoutineTemplateView;
}): React.JSX.Element {
  return (
    <Pressable onPress={() => props.onLoad(props.tpl)} style={s.editBtn}>
      <Text style={s.editBtnText}>
        {props.isGlobal ? props.t('common.view') : props.t('coach.routine.list.edit')}
      </Text>
    </Pressable>
  );
}
