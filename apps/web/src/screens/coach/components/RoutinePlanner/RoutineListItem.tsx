import React from 'react';
import { Text, View } from 'react-native';
import { Badge, Button } from '@trainerpro/ui';
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
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text numberOfLines={2} style={s.templateName}>
          {props.tpl.name}
        </Text>
        {props.isGlobal && <Badge label={props.t('common.global')} tone="primary" />}
        {props.isAssigned && <Badge label={props.t('coach.routine.list.inUse')} tone="primary" />}
      </View>
      <Text style={s.templateMeta}>{props.t('coach.routine.list.days', { count: props.tpl.days.length })}</Text>
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
        <Button
          label={resolveAssignLabel(props.clientContextName, props.t)}
          onPress={() => void props.onAssignTemplate?.(props.tpl.id)}
          size="sm"
          variant="secondary"
        />
      )}
      <LoadButton isGlobal={props.isGlobal} onLoad={props.onLoad} t={props.t} tpl={props.tpl} />
      {!props.isGlobal && !props.isAssigned && (
        <Button
          label={props.t('coach.routine.list.delete')}
          onPress={() => props.onDelete(props.tpl.id)}
          size="sm"
          variant="danger"
        />
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
    <Button
      label={props.isGlobal ? props.t('common.view') : props.t('coach.routine.list.edit')}
      onPress={() => props.onLoad(props.tpl)}
      size="sm"
      variant="secondary"
    />
  );
}
