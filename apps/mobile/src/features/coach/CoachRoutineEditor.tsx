import { CoachRoutineDayActions } from './CoachRoutineDayActions';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  COACH_BLOCK_ARRAYS,
  COACH_BLOCKS,
  createCoachBlock,
  normalizeCoachRoutine,
  type CoachBlockKind,
} from '@trainerpro/shared';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import { useCoachQuery } from '../../data/hooks/useCoachData';
import { stableDraftValue } from '../../data/coach-draft-policy';
import { CoachButton, CoachConflict, CoachField, CoachPage, CoachSelect, ui } from './CoachUi';
import { CoachClientPicker } from './CoachClientPicker';
import { CoachPdfButton } from './CoachPdfButton';
import { CoachPlanBlockEditor } from './CoachPlanBlockEditor';
import { useCoachTemplateSave } from './useCoachTemplateSave';
import {
  changeRoutineBlock,
  freshRoutineDay,
  reorderRoutineBlock,
  routineEntries,
  moveRoutineBlockToDay,
  type PlanEntry,
  type PlanRecord,
} from './coach-plan-model';

type RoutineEditorProps = { template?: PlanRecord; clientId?: string; onBack: () => void };
export function CoachRoutineEditor(props: RoutineEditorProps) {
  const model = useRoutineEditor(props);
  const { block, day, updateDay, setBlock } = model;
  if (block && day) {
    const value = (day[COACH_BLOCK_ARRAYS[block.kind]] as PlanRecord[])[block.index];
    if (value)
      return (
        <CoachPlanBlockEditor
          kind={block.kind}
          value={value}
          onChange={(next) => updateDay(changeRoutineBlock(day, block.kind, block.index, next))}
          onBack={() => setBlock(null)}
          groups={(day.groups as PlanRecord[]) ?? []}
        />
      );
  }
  return <RoutineEditorView {...model} {...props} />;
}
function useRoutineEditor({ template, clientId, onBack }: RoutineEditorProps) {
  const { t } = useTranslation();
  const initial = template
    ? normalizeCoachRoutine(template)
    : { name: '', days: [freshRoutineDay(t('coachWorkspace.routineDay'))], neats: [], objectiveIds: [] };
  const draft = useCoachDraft<PlanRecord>(
    'routine:' +
      (template?.id ??
        (template?.draftSourceId ? 'copyof:' + String(template.draftSourceId) + ':' + clientId : 'new:' + clientId)),
    initial,
    template ? stableDraftValue(template) : undefined,
  );
  const [dayIndex, setDayIndex] = useState(0);
  const [block, setBlock] = useState<{ kind: CoachBlockKind; index: number } | null>(null);
  const [assignClient, setAssignClient] = useState(clientId ?? '');
  const [copy, setCopy] = useState(false);
  const days = (draft.value.days as PlanRecord[]) ?? [];
  const day = days[dayIndex];
  const update = (next: PlanRecord) => draft.setValue(next);
  const updateDay = (next: PlanRecord) =>
    update({ ...draft.value, days: days.map((value, i) => (i === dayIndex ? next : value)) });
  const { save, write, saveBlocked } = useCoachTemplateSave({
    kind: 'routines',
    draft,
    template,
    copy,
    clientId: assignClient || undefined,
    onBack,
  });
  return {
    t,
    write,
    draft,
    dayIndex,
    setDayIndex,
    block,
    setBlock,
    assignClient,
    setAssignClient,
    copy,
    setCopy,
    days,
    day,
    update,
    updateDay,
    save,
    saveBlocked,
  };
}
function RoutineEditorView({
  template,
  onBack,
  t,
  write,
  draft,
  dayIndex,
  setDayIndex,
  setBlock,
  assignClient,
  setAssignClient,
  copy,
  setCopy,
  days,
  day,
  update,
  updateDay,
  save,
  saveBlocked,
}: RoutineEditorProps & ReturnType<typeof useRoutineEditor>) {
  return (
    <CoachPage title={t('coachWorkspace.routines')} onBack={onBack}>
      <CoachConflict conflict={saveBlocked} onDiscard={() => void draft.clear()} />
      <CoachField
        label={t('coachWorkspace.field.name')}
        value={String(draft.value.name ?? '')}
        onChange={(name) => update({ ...draft.value, name })}
      />
      <CoachField
        label={t('coachWorkspace.field.expectedCompletionDays')}
        value={String(draft.value.expectedCompletionDays ?? '')}
        numeric
        onChange={(next) => update({ ...draft.value, expectedCompletionDays: next ? Number(next) : null })}
      />
      <RoutineObjectives value={draft.value} onChange={update} />
      <CoachSelect
        label={t('coachWorkspace.routineDay')}
        value={String(dayIndex)}
        onChange={(next) => setDayIndex(Number(next))}
        options={days.map((value, i) => ({ value: String(i), label: String(value.title) }))}
      />
      {day ? (
        <RoutineDay
          value={day}
          onChange={updateDay}
          onEdit={setBlock}
          days={days}
          dayIndex={dayIndex}
          onMove={(entry, to) => update({ ...draft.value, days: moveRoutineBlockToDay(days, dayIndex, to, entry) })}
        />
      ) : null}
      <CoachRoutineDayActions
        value={draft.value}
        days={days}
        dayIndex={dayIndex}
        setDayIndex={setDayIndex}
        update={update}
      />
      <RoutineNeats value={draft.value} onChange={update} />
      <RoutineSaveActions
        template={template}
        draft={draft}
        copy={copy}
        setCopy={setCopy}
        assignClient={assignClient}
        setAssignClient={setAssignClient}
        write={write}
        save={save}
        saveBlocked={saveBlocked}
      />
    </CoachPage>
  );
}
function RoutineSaveActions({
  template,
  draft,
  copy,
  setCopy,
  assignClient,
  setAssignClient,
  write,
  save,
  saveBlocked,
}: Pick<
  ReturnType<typeof useRoutineEditor>,
  'draft' | 'copy' | 'setCopy' | 'assignClient' | 'setAssignClient' | 'write' | 'save' | 'saveBlocked'
> & { template?: PlanRecord }) {
  const { t } = useTranslation();
  return (
    <>
      {' '}
      <CoachClientPicker value={assignClient} onChange={setAssignClient} optional />
      <CoachSelect
        label={t('coachWorkspace.saveMode')}
        value={copy ? 'copy' : 'edit'}
        onChange={(next) => setCopy(next === 'copy')}
        options={[
          { value: 'edit', label: t('coachWorkspace.save') },
          { value: 'copy', label: t('coachWorkspace.saveCopy') },
        ]}
      />
      <CoachPdfButton
        title={String(draft.value.name ?? t('coachWorkspace.routines'))}
        sections={routineDocumentSections(draft.value, t)}
      />
      <CoachButton
        label={t('coachWorkspace.save')}
        loading={write.isPending}
        disabled={!draft.ready || saveBlocked || (template?.scope === 'GLOBAL' && !copy)}
        onPress={() => void save().catch(() => undefined)}
      />
    </>
  );
}
function RoutineObjectives({ value, onChange }: { value: PlanRecord; onChange: (next: PlanRecord) => void }) {
  const query = useCoachQuery<{ items: { id: string; label: string }[] }>('/plans/templates/routines/catalog/objectives');
  const ids = (value.objectiveIds as string[]) ?? [];
  return (
    <View style={ui.row}>
      {query.data?.items.map((objective) => (
        <CoachButton
          key={objective.id}
          label={(ids.includes(objective.id) ? '✓ ' : '') + objective.label}
          disabled={ids.length >= 3 && !ids.includes(objective.id)}
          onPress={() =>
            onChange({
              ...value,
              objectiveIds: ids.includes(objective.id) ? ids.filter((id) => id !== objective.id) : [...ids, objective.id],
            })
          }
        />
      ))}
    </View>
  );
}
function RoutineNeats({ value, onChange }: { value: PlanRecord; onChange: (next: PlanRecord) => void }) {
  const { t } = useTranslation();
  const neats = (value.neats as PlanRecord[]) ?? [];
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{t('coachWorkspace.neat')}</Text>
      {neats.map((neat, index) => (
        <View style={ui.field} key={index}>
          {['title', 'description'].map((field) => (
            <CoachField
              key={field}
              label={t('coachWorkspace.field.' + field)}
              value={String(neat[field] ?? '')}
              onChange={(next) =>
                onChange({ ...value, neats: neats.map((item, i) => (i === index ? { ...item, [field]: next } : item)) })
              }
            />
          ))}
          <CoachButton
            label={t('coachWorkspace.delete')}
            onPress={() => onChange({ ...value, neats: neats.filter((_, i) => i !== index) })}
            danger
          />
        </View>
      ))}
      <CoachButton
        label={t('coachWorkspace.add')}
        disabled={neats.length >= 20}
        onPress={() => onChange({ ...value, neats: [...neats, { title: '', description: '' }] })}
      />
    </View>
  );
}
function RoutineDay({
  value,
  onChange,
  onEdit,
  days,
  dayIndex,
  onMove,
}: {
  value: PlanRecord;
  onChange: (next: PlanRecord) => void;
  onEdit: (entry: { kind: CoachBlockKind; index: number }) => void;
  days: PlanRecord[];
  dayIndex: number;
  onMove: (entry: PlanEntry, to: number) => void;
}) {
  const { t } = useTranslation();
  const entries = routineEntries(value);
  const add = (kind: CoachBlockKind) => {
    const key = COACH_BLOCK_ARRAYS[kind];
    const blocks = (value[key] as PlanRecord[]) ?? [];
    onChange({ ...value, [key]: [...blocks, createCoachBlock(kind, t('coachWorkspace.block.' + kind), entries.length)] });
    onEdit({ kind, index: blocks.length });
  };
  const duplicate = (entry: PlanEntry) => {
    const key = COACH_BLOCK_ARRAYS[entry.kind];
    const next = { ...entry.value, id: undefined, sortOrder: entries.length };
    onChange({ ...value, [key]: [...(value[key] as PlanRecord[]), next] });
  };
  return (
    <View style={ui.card}>
      <CoachField
        label={t('coachWorkspace.title')}
        value={String(value.title ?? '')}
        onChange={(title) => onChange({ ...value, title })}
      />
      <CoachField
        label={t('coachWorkspace.field.notes')}
        value={String(value.notes ?? '')}
        onChange={(notes) => onChange({ ...value, notes })}
        multiline
      />
      <View style={ui.row}>
        {COACH_BLOCKS.map((kind) => (
          <CoachButton key={kind} label={'+ ' + t('coachWorkspace.block.' + kind)} onPress={() => add(kind)} />
        ))}
      </View>
      {entries.map((entry) => (
        <View key={entry.kind + ':' + entry.index} style={ui.card}>
          <Text style={ui.label}>{String(entry.value.displayName)}</Text>
          {days.length > 1 ? (
            <CoachSelect
              label={t('coachWorkspace.moveToDay')}
              value={String(dayIndex)}
              options={days.map((day, index) => ({ value: String(index), label: String(day.title) }))}
              onChange={(next) => onMove(entry, Number(next))}
            />
          ) : null}
          <View style={ui.row}>
            <CoachButton label={t('coachWorkspace.edit')} onPress={() => onEdit(entry)} />
            <CoachButton label={t('coachWorkspace.up')} onPress={() => onChange(reorderRoutineBlock(value, entry, -1))} />
            <CoachButton label={t('coachWorkspace.down')} onPress={() => onChange(reorderRoutineBlock(value, entry, 1))} />
            <CoachButton label={t('coachWorkspace.duplicate')} onPress={() => duplicate(entry)} />
            <CoachButton
              label={t('coachWorkspace.delete')}
              onPress={() => onChange(changeRoutineBlock(value, entry.kind, entry.index, null))}
              danger
            />
          </View>
        </View>
      ))}
      <RoutineGroups value={value} onChange={onChange} />
      <DayWarmups value={value} onChange={onChange} />
    </View>
  );
}
function RoutineGroups({ value, onChange }: { value: PlanRecord; onChange: (next: PlanRecord) => void }) {
  const { t } = useTranslation();
  const groups = (value.groups as PlanRecord[]) ?? [];
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{t('coachWorkspace.groups')}</Text>
      {groups.map((group, index) => (
        <View key={index} style={ui.field}>
          <CoachSelect
            label={t('coachWorkspace.group')}
            value={String(group.groupType)}
            onChange={(next) =>
              onChange({ ...value, groups: groups.map((item, i) => (i === index ? { ...item, groupType: next } : item)) })
            }
            options={['CIRCUIT', 'SUPERSET'].map((type) => ({ value: type, label: t('coachWorkspace.' + type) }))}
          />
          <CoachField
            label={t('coachWorkspace.field.note')}
            value={String(group.note ?? '')}
            onChange={(note) =>
              onChange({ ...value, groups: groups.map((item, i) => (i === index ? { ...item, note } : item)) })
            }
          />
          <CoachButton
            label={t('coachWorkspace.delete')}
            onPress={() => {
              const id = group.clientId ?? group.id;
              let next = { ...value, groups: groups.filter((_, i) => i !== index) };
              for (const entry of routineEntries(value))
                if (entry.value.groupId === id)
                  next = changeRoutineBlock(next, entry.kind, entry.index, { ...entry.value, groupId: null }) as typeof next;
              onChange(next);
            }}
            danger
          />
        </View>
      ))}
      <CoachButton
        label={t('coachWorkspace.addGroup')}
        onPress={() =>
          onChange({
            ...value,
            groups: [...groups, { clientId: 'g-' + Date.now(), groupType: 'CIRCUIT', sortOrder: groups.length, note: '' }],
          })
        }
      />
    </View>
  );
}
function DayWarmups({ value, onChange }: { value: PlanRecord; onChange: (next: PlanRecord) => void }) {
  const { t } = useTranslation();
  const query = useCoachQuery<{ items: { id: string; name: string }[] }>('/plans/templates/warmups?summary=true');
  const ids = (value.warmupTemplateIds as string[]) ?? [];
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{t('coachWorkspace.warmups')}</Text>
      {query.data?.items.map((warmup) => (
        <CoachButton
          key={warmup.id}
          label={(ids.includes(warmup.id) ? '✓ ' : '') + warmup.name}
          onPress={() =>
            onChange({
              ...value,
              warmupTemplateIds: ids.includes(warmup.id) ? ids.filter((id) => id !== warmup.id) : [...ids, warmup.id],
            })
          }
        />
      ))}
    </View>
  );
}

function routineDocumentSections(value: PlanRecord, t: (key: string) => string) {
  const sections = ((value.days as PlanRecord[]) ?? []).map((day) => ({
    title: String(day.title ?? ''),
    lines: [
      String(day.notes ?? ''),
      ...routineEntries(day).flatMap((entry) => [
        String(entry.value.displayName ?? '') + ' · ' + t('coachWorkspace.block.' + entry.kind),
        ...['setsPlanned', 'repsMin', 'repsMax', 'restSeconds', 'notes']
          .filter((key) => entry.value[key] != null && entry.value[key] !== '')
          .map((key) => t('coachWorkspace.field.' + key) + ': ' + String(entry.value[key])),
        ...((entry.value.sets as PlanRecord[]) ?? []).map(
          (set, i) =>
            t('coachWorkspace.set') +
            ' ' +
            (i + 1) +
            ': ' +
            Object.entries(set)
              .filter(([key, v]) => key !== 'setIndex' && v != null)
              .map(([key, v]) => t('coachWorkspace.field.' + key) + ' ' + String(v))
              .join(' · '),
        ),
      ]),
      ...((day.groups as PlanRecord[]) ?? []).map(
        (group) => t('coachWorkspace.' + String(group.groupType)) + ': ' + String(group.note ?? ''),
      ),
    ].filter(Boolean),
  }));
  const neats = (value.neats as PlanRecord[]) ?? [];
  if (neats.length)
    sections.push({
      title: t('coachWorkspace.neat'),
      lines: neats.map((neat) => String(neat.title ?? '') + ' · ' + String(neat.description ?? '')),
    });
  return sections;
}
