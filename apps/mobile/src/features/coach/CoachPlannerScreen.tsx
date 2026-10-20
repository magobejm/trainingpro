import { coachDocumentSetLines } from './coach-plan-model';
import { normalizeLegacyLockedFields } from '@trainerpro/shared';
import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COACH_BLOCKS, createCoachBlock, moveCoachItem, type CoachBlockKind } from '@trainerpro/shared';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import { stableDraftValue } from '../../data/coach-draft-policy';
import { CoachButton, CoachConflict, CoachField, CoachPage, CoachStatus, confirmCoachDelete, ui } from './CoachUi';
import { CoachRoutineEditor } from './CoachRoutineEditor';
import { CoachPlanBlockEditor } from './CoachPlanBlockEditor';
import type { PlanRecord } from './coach-plan-model';
import { useCoachEditor } from './useCoachEditor';
import { CoachPdfButton } from './CoachPdfButton';
import { useCoachTemplateSave } from './useCoachTemplateSave';
export function CoachPlannerScreen({ warmup = false, clientId }: { warmup?: boolean; clientId?: string }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const editor = useCoachEditor<{ id: string; duplicate: boolean }>();
  const selected = editor.value?.id ?? null;
  const duplicate = editor.value?.duplicate ?? false;
  const setSelected = (id: string) => editor.select({ id, duplicate: false });
  const [cursor, setCursor] = useState('');
  const path = '/plans/templates/' + (warmup ? 'warmups' : 'routines');
  const query = useCoachQuery<{ items: PlanRecord[]; nextCursor?: string }>(
    path + '?summary=true&limit=50' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''),
  );
  const detail = useCoachQuery<PlanRecord>(selected && selected !== 'new' ? path + '/' + selected : null);
  const write = useCoachWrite();
  const close = editor.close;
  const items = (query.data?.items ?? []).filter((item) =>
    String(item.name).toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  if (selected) {
    if (selected !== 'new' && !detail.data)
      return (
        <CoachPage title={t('coachWorkspace.routines')} onBack={close}>
          <CoachStatus query={detail} />
        </CoachPage>
      );
    const original = selected === 'new' ? undefined : detail.data;
    const template =
      duplicate && original
        ? {
            ...original,
            id: undefined,
            draftSourceId: original.id,
            scope: 'COACH',
            name: String(original.name) + ' · ' + t('coachWorkspace.copy'),
          }
        : original;
    return warmup ? (
      <WarmupEditor key={selected + ':' + duplicate} template={template} onBack={close} />
    ) : (
      <CoachRoutineEditor key={selected + ':' + duplicate} template={template} clientId={clientId} onBack={close} />
    );
  }
  return (
    <FlatList
      style={ui.page}
      contentContainerStyle={ui.content}
      data={items}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={ui.field}>
          <Text style={ui.title}>{t(warmup ? 'coachWorkspace.warmups' : 'coachWorkspace.routines')}</Text>
          <CoachField label={t('coachWorkspace.search')} value={search} onChange={setSearch} />
          <CoachButton label={t('coachWorkspace.create')} onPress={() => setSelected('new')} />
          <CoachStatus query={query} empty={items.length === 0} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={ui.card}>
          <Text style={ui.label}>{String(item.name)}</Text>
          <Text style={ui.muted}>
            {String(item.scope)}
            {' · '}
            {t('coachWorkspace.version')} {String(item.templateVersion)}
          </Text>
          <CoachButton label={t('coachWorkspace.open')} onPress={() => setSelected(String(item.id))} />
          <CoachButton
            label={t('coachWorkspace.duplicate')}
            onPress={() => {
              editor.select({ id: String(item.id), duplicate: true });
            }}
          />
          {item.scope === 'COACH' ? (
            <CoachButton
              label={t('coachWorkspace.delete')}
              disabled={write.isPending}
              danger
              onPress={() =>
                confirmCoachDelete(
                  String(item.name),
                  () => write.mutate({ path: path + '/' + item.id, method: 'DELETE' }),
                  t,
                )
              }
            />
          ) : null}
        </View>
      )}
      ListFooterComponent={
        <View style={ui.row}>
          {cursor ? <CoachButton label={t('coachWorkspace.firstPage')} onPress={() => setCursor('')} /> : null}
          {query.data?.nextCursor ? (
            <CoachButton label={t('coachWorkspace.loadMore')} onPress={() => setCursor(query.data!.nextCursor!)} />
          ) : null}
        </View>
      }
    />
  );
}
type WarmupEditorProps = { template?: PlanRecord; onBack: () => void };
function WarmupEditor(props: WarmupEditorProps) {
  const model = useWarmupEditor(props);
  const { active, items, groups, setActive, updateItems } = model;
  if (active !== null && items[active]) {
    const item = items[active]!;
    const metadata = item.metadataJson as PlanRecord | undefined;
    return (
      <CoachPlanBlockEditor
        warmup
        kind={item.blockType as CoachBlockKind}
        value={{
          ...item,
          sets: metadata?.sets ?? [],
          lockedFields:
            metadata?.setVariablesVersion === 2
              ? metadata.lockedFields
              : normalizeLegacyLockedFields(
                  item.blockType as CoachBlockKind,
                  metadata?.lockedFields as string[] | undefined,
                ),
        }}
        groups={groups}
        onBack={() => setActive(null)}
        onChange={(next) => {
          const { sets, lockedFields, ...body } = next;
          updateItems(
            items.map((old, i) =>
              i === active
                ? {
                    ...body,
                    metadataJson: {
                      ...((old.metadataJson as PlanRecord) ?? {}),
                      sets,
                      lockedFields,
                      setVariablesVersion: 2,
                    },
                  }
                : old,
            ),
          );
        }}
      />
    );
  }
  return <WarmupEditorView {...model} {...props} />;
}
function useWarmupEditor({ template, onBack }: WarmupEditorProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState<number | null>(null);
  const draft = useCoachDraft<PlanRecord>(
    'warmup:' + (template?.id ?? (template?.draftSourceId ? 'copyof:' + String(template.draftSourceId) : 'new')),
    template ?? { name: '', items: [], groups: [] },
    template ? stableDraftValue(template) : undefined,
  );
  const items = (draft.value.items as PlanRecord[]) ?? [];
  const groups = (draft.value.groups as PlanRecord[]) ?? [];
  const updateItems = (next: PlanRecord[]) =>
    draft.setValue((old) => ({ ...old, items: next.map((item, i) => ({ ...item, sortOrder: i })) }));
  const { save, write, saveBlocked } = useCoachTemplateSave({ kind: 'warmups', draft, template, onBack });
  return { t, write, active, setActive, draft, items, groups, updateItems, save, saveBlocked };
}
function WarmupEditorView({
  template,
  onBack,
  t,
  write,
  setActive,
  draft,
  items,
  groups,
  updateItems,
  save,
  saveBlocked,
}: WarmupEditorProps & ReturnType<typeof useWarmupEditor>) {
  return (
    <CoachPage title={t('coachWorkspace.warmups')} onBack={onBack}>
      <CoachConflict conflict={saveBlocked} onDiscard={() => void draft.clear()} />
      <CoachField
        label={t('coachWorkspace.field.name')}
        value={String(draft.value.name ?? '')}
        onChange={(name) => draft.setValue((old) => ({ ...old, name }))}
      />
      <View style={ui.row}>
        {COACH_BLOCKS.map((kind) => (
          <CoachButton
            key={kind}
            label={'+ ' + t('coachWorkspace.block.' + kind)}
            onPress={() => {
              const block = createCoachBlock(kind, t('coachWorkspace.block.' + kind), items.length);
              updateItems([
                ...items,
                {
                  ...block,
                  blockType: kind,
                  metadataJson: { sets: block.sets, lockedFields: block.lockedFields, setVariablesVersion: 2 },
                },
              ]);
              setActive(items.length);
            }}
          />
        ))}
      </View>
      {items.map((item, index) => (
        <View key={index} style={ui.card}>
          <Text style={ui.label}>{String(item.displayName)}</Text>
          <View style={ui.row}>
            <CoachButton label={t('coachWorkspace.edit')} onPress={() => setActive(index)} />
            <CoachButton
              label={t('coachWorkspace.up')}
              onPress={() => updateItems(moveCoachItem(items, index, index - 1))}
            />
            <CoachButton
              label={t('coachWorkspace.down')}
              onPress={() => updateItems(moveCoachItem(items, index, index + 1))}
            />
            <CoachButton
              label={t('coachWorkspace.duplicate')}
              onPress={() => updateItems([...items, { ...item, id: undefined }])}
            />
            <CoachButton
              label={t('coachWorkspace.delete')}
              onPress={() => updateItems(items.filter((_, i) => i !== index))}
              danger
            />
          </View>
        </View>
      ))}
      <WarmupGroups groups={groups} items={items} draft={draft} />
      <CoachButton
        label={t('coachWorkspace.addGroup')}
        onPress={() =>
          draft.setValue((old) => ({
            ...old,
            groups: [...groups, { id: 'wg-' + Date.now(), groupType: 'CIRCUIT', sortOrder: groups.length, note: '' }],
          }))
        }
      />
      <CoachPdfButton
        title={String(draft.value.name ?? t('coachWorkspace.warmups'))}
        sections={warmupDocumentSections(draft.value, t)}
      />
      <CoachButton
        label={t('coachWorkspace.save')}
        loading={write.isPending}
        disabled={!draft.ready || saveBlocked || template?.scope === 'GLOBAL'}
        onPress={() => void save().catch(() => undefined)}
      />
    </CoachPage>
  );
}

function warmupDocumentSections(value: PlanRecord, t: (key: string) => string) {
  return ((value.items as PlanRecord[]) ?? []).map((item, index) => ({
    title: index + 1 + '. ' + String(item.displayName ?? ''),
    lines: [
      t('coachWorkspace.block.' + String(item.blockType)),
      ...[
        'notes',
        'setsPlanned',
        'roundsPlanned',
        'repsMin',
        'repsMax',
        'workSeconds',
        'restSeconds',
        'durationMinutes',
        'targetRpe',
        'targetRir',
      ]
        .filter(
          (key) =>
            item[key] != null &&
            item[key] !== '' &&
            !(['cardio', 'sport'].includes(String(item.blockType)) && ['workSeconds', 'durationMinutes'].includes(key)),
        )
        .map((key) => t('coachWorkspace.field.' + key) + ': ' + String(item[key])),
      ...coachDocumentSetLines(
        item.blockType as CoachBlockKind,
        item,
        t,
        ((item.metadataJson as PlanRecord | undefined)?.sets as PlanRecord[]) ?? [],
      ),
    ],
  }));
}

function WarmupGroups({ groups, items, draft }: Pick<ReturnType<typeof useWarmupEditor>, 'groups' | 'items' | 'draft'>) {
  const { t } = useTranslation();
  return (
    <>
      {groups.map((group, index) => (
        <View key={index} style={ui.card}>
          <Text style={ui.label}>
            {t('coachWorkspace.CIRCUIT')} {index + 1}
          </Text>
          <CoachField
            label={t('coachWorkspace.field.note')}
            value={String(group.note ?? '')}
            onChange={(note) =>
              draft.setValue((old) => ({ ...old, groups: groups.map((g, i) => (i === index ? { ...g, note } : g)) }))
            }
          />
          <CoachButton
            label={t('coachWorkspace.delete')}
            onPress={() => {
              draft.setValue((old) => ({
                ...old,
                groups: groups.filter((_, i) => i !== index),
                items: items.map((entry) => (entry.groupId === group.id ? { ...entry, groupId: null } : entry)),
              }));
            }}
            danger
          />
        </View>
      ))}
    </>
  );
}
