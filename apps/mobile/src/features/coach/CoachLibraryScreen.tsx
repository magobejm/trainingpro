import React, { useState } from 'react';
import { FlatList, Image, Linking, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COACH_LIBRARY_PATHS, type CoachBlockKind } from '@trainerpro/shared';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import {
  CoachButton,
  CoachConflict,
  CoachField,
  CoachPage,
  CoachSelect,
  CoachStatus,
  confirmCoachDelete,
  ui,
} from './CoachUi';
import { useCoachUpload } from './useCoachUpload';
import { useCoachEditor } from './useCoachEditor';
import { coachLibraryQueryPath } from './coach-library-query';
import { useCoachAuth } from '../../data/hooks/useCoachData';
import { createApiClient } from '../../data/api-client';
import { stableDraftValue } from '../../data/coach-draft-policy';
import { useCoachSaveGuard } from './useCoachSaveGuard';
import { findCoachResource } from './coach-revision';
import { categories, catalogFields, foodNumbers, type Catalog, type CoachLibraryItem } from './coach-library-model';
export type { CoachLibraryItem } from './coach-library-model';
type CoachLibraryProps = {
  initialCategory?: string;
  onBack?: () => void;
  onPick?: (item: CoachLibraryItem, category: string) => void;
};
export function CoachLibraryScreen({ initialCategory, onPick, onBack }: CoachLibraryProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState(initialCategory ?? 'strength');
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('');
  const editor = useCoachEditor<CoachLibraryItem | 'new'>();
  const selected = editor.value;
  const setSelected = editor.select;
  const [cursor, setCursor] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const catalogs = useCoachQuery<Record<string, Catalog[]>>(category === 'foods' ? null : '/library/catalogs');
  const query = useCoachQuery<{ items: CoachLibraryItem[]; nextCursor?: string }>(
    coachLibraryQueryPath(category, search, cursor, filters),
  );
  const write = useCoachWrite();
  const resource = category === 'foods' ? 'foods' : COACH_LIBRARY_PATHS[category as CoachBlockKind];
  const items = (query.data?.items ?? []).filter((item) => !scope || item.scope?.toLowerCase() === scope);
  if (selected)
    return (
      <LibraryEditor
        key={selected === 'new' ? category + ':new' : selected.id}
        item={selected === 'new' ? undefined : selected}
        category={category}
        onClose={() => {
          editor.close();
          void query.refetch();
        }}
      />
    );
  return (
    <FlatList
      style={ui.page}
      contentContainerStyle={ui.content}
      data={items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={ui.field}>
          {onBack ? <CoachButton label={t('coachWorkspace.cancel')} onPress={onBack} /> : null}
          <Text style={ui.title}>{t('coachWorkspace.library')}</Text>
          {!initialCategory ? (
            <CoachSelect
              label={t('coachWorkspace.category')}
              value={category}
              onChange={(next) => {
                setCategory(next);
                setCursor('');
                setFilters({});
              }}
              options={categories.map((value) => ({ value, label: t('coachWorkspace.block.' + value) }))}
            />
          ) : null}
          <CoachField
            label={t('coachWorkspace.search')}
            value={search}
            onChange={(next) => {
              setSearch(next);
              setCursor('');
            }}
          />
          <CoachSelect
            label={t('coachWorkspace.scope')}
            value={scope}
            onChange={setScope}
            options={['', 'coach', 'global'].map((value) => ({
              value,
              label: t('coachWorkspace.scope.' + (value || 'all')),
            }))}
          />
          {category !== 'foods' ? (
            <LibraryCatalogFilters
              category={category}
              catalogs={catalogs.data ?? {}}
              filters={filters}
              onChange={(next) => {
                setFilters(next);
                setCursor('');
              }}
            />
          ) : null}
          <CoachButton label={t('coachWorkspace.create')} onPress={() => setSelected('new')} />
          <CoachStatus query={query} empty={items.length === 0} />
        </View>
      }
      renderItem={({ item }) => (
        <LibraryItemCard
          item={item}
          category={category}
          onPick={onPick}
          resource={resource}
          write={write}
          onEdit={setSelected}
        />
      )}
      ListFooterComponent={<LibraryPages cursor={cursor} nextCursor={query.data?.nextCursor} onChange={setCursor} />}
    />
  );
}
function LibraryPages({
  cursor,
  nextCursor,
  onChange,
}: {
  cursor: string;
  nextCursor?: string;
  onChange: (cursor: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={ui.row}>
      {cursor ? <CoachButton label={t('coachWorkspace.firstPage')} onPress={() => onChange('')} /> : null}
      {nextCursor ? <CoachButton label={t('coachWorkspace.loadMore')} onPress={() => onChange(nextCursor)} /> : null}
    </View>
  );
}
function LibraryCatalogFilters({
  category,
  catalogs,
  filters,
  onChange,
}: {
  category: string;
  catalogs: Record<string, Catalog[]>;
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  const specific: Record<string, [string, string]> = {
    strength: ['muscleGroupIds', 'muscleGroups'],
    cardio: ['cardioTypeIds', 'cardioMethodTypes'],
    isometric: ['isometricTypeIds', 'isometricTypes'],
    plio: ['plioTypeIds', 'plioTypes'],
    mobility: ['mobilityTypeIds', 'mobilityTypes'],
    sport: ['sportTypeIds', 'sportTypes'],
  };
  const fields = [
    specific[category],
    ...(category === 'strength' || category === 'cardio' ? [['equipmentIds', 'equipmentTypes'] as [string, string]] : []),
  ].filter(Boolean) as [string, string][];
  return (
    <View style={ui.field}>
      {fields.map(([key, catalog]) => (
        <CoachSelect
          key={key}
          label={t(
            key === 'muscleGroupIds'
              ? 'coachWorkspace.muscleGroups'
              : 'coachWorkspace.field.' + (key === 'equipmentIds' ? 'equipmentId' : key.replace(/Ids$/, 'Id')),
          )}
          value={filters[key] ?? ''}
          onChange={(value) => onChange({ ...filters, [key]: value })}
          options={[
            { value: '', label: t('coachWorkspace.scope.all') },
            ...(catalogs[catalog] ?? []).map((item) => ({ value: item.id, label: item.label })),
          ]}
        />
      ))}
    </View>
  );
}
function LibraryItemCard({
  item,
  category,
  onPick,
  resource,
  write,
  onEdit,
}: {
  item: CoachLibraryItem;
  category: string;
  onPick?: (item: CoachLibraryItem, category: string) => void;
  resource: string;
  write: ReturnType<typeof useCoachWrite>;
  onEdit: (item: CoachLibraryItem) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{item.name}</Text>
      <Text style={ui.muted}>{item.instructions ?? ''}</Text>
      {item.mediaUrl || item.media?.url ? (
        <Image accessibilityLabel={item.name} source={{ uri: item.mediaUrl ?? item.media?.url }} style={libraryImage} />
      ) : null}
      {item.youtubeUrl ? (
        <CoachButton label={t('coachWorkspace.video')} onPress={() => void Linking.openURL(item.youtubeUrl!)} />
      ) : null}
      {onPick ? <CoachButton label={t('coachWorkspace.choose')} onPress={() => onPick(item, category)} /> : null}
      <View style={ui.row}>
        {item.scope?.toLowerCase() === 'coach' ? (
          <>
            <CoachButton label={t('coachWorkspace.edit')} onPress={() => onEdit(item)} />
            <CoachButton
              label={t('coachWorkspace.delete')}
              disabled={write.isPending}
              danger
              onPress={() =>
                confirmCoachDelete(
                  item.name,
                  () => write.mutate({ path: '/library/' + resource + '/' + item.id, method: 'DELETE' }),
                  t,
                )
              }
            />
          </>
        ) : (
          <Text style={ui.muted}>{t('coachWorkspace.readOnly')}</Text>
        )}
        <CoachButton
          label={t('coachWorkspace.duplicate')}
          onPress={() =>
            onEdit({
              ...item,
              id: '',
              draftSourceId: item.id,
              scope: 'coach',
              name: item.name + ' · ' + t('coachWorkspace.copy'),
            })
          }
        />
      </View>
    </View>
  );
}
const libraryImage = { width: 160, height: 120, borderRadius: 12 };
type LibraryEditorProps = { item?: CoachLibraryItem; category: string; onClose: () => void };
function LibraryEditor(props: LibraryEditorProps) {
  return <LibraryEditorView {...useLibraryEditor(props)} {...props} />;
}
function useLibraryEditor({ item, category, onClose }: LibraryEditorProps) {
  const { t } = useTranslation();
  const write = useCoachWrite();
  const upload = useCoachUpload('/library/media-image');
  const auth = useCoachAuth();
  const guard = useCoachSaveGuard();
  const catalogs = useCoachQuery<Record<string, Catalog[]>>('/library/catalogs');
  const initial: Record<string, unknown> = {
    ...item,
    name: item?.name ?? '',
    category: category === 'mobility' ? 'warmup' : category,
    cardioTypeId: item?.cardioTypeId ?? item?.methodTypeId ?? '',
    servingUnit: item?.servingUnit ?? '100g',
    mediaUrl: item?.mediaUrl ?? item?.media?.url ?? '',
    muscleGroupIds: item?.muscleGroups?.map((g) => g.muscleGroupId ?? g.id).filter(Boolean) ?? [],
  };
  const draft = useCoachDraft(
    'library:' + category + ':' + (item?.id || (item?.draftSourceId ? 'copyof:' + String(item.draftSourceId) : 'new')),
    initial,
    item?.id ? stableDraftValue(item) : undefined,
  );
  const value = draft.value;
  const set = (key: string, next: unknown) => draft.setValue((old) => ({ ...old, [key]: next }));
  const fields =
    category === 'foods'
      ? ['name', 'notes', 'foodCategory', 'mediaUrl', 'micronutrients']
      : ['name', 'instructions', 'coachInstructions', 'mediaUrl', 'youtubeUrl'];
  const referenceFields =
    category === 'strength'
      ? ['equipmentId', 'movementPatternId', 'anatomicalPlaneId']
      : ['equipmentId', category === 'cardio' ? 'cardioTypeId' : category + 'TypeId'];
  const persist = async () => {
    const body =
      category === 'foods'
        ? Object.fromEntries(
            [...fields.filter((f) => f !== 'micronutrients'), ...foodNumbers, 'servingUnit', 'foodType']
              .map((key) => [key, value[key] === '' ? null : value[key]])
              .concat([
                [
                  'micronutrients',
                  Array.isArray(value.micronutrients)
                    ? value.micronutrients
                    : String(value.micronutrients ?? '')
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean),
                ],
              ]),
          )
        : {
            category: value.category,
            name: value.name,
            mediaUrl: value.mediaUrl || null,
            youtubeUrl: value.youtubeUrl || null,
            instructions: value.instructions || null,
            coachInstructions: value.coachInstructions || null,
            muscleGroupIds: value.muscleGroupIds ?? [],
            ...Object.fromEntries(referenceFields.map((key) => [key, value[key] || null])),
          };
    await write.mutateAsync({
      path: '/library/' + (category === 'foods' ? 'foods' : 'exercises/unified') + (item?.id ? '/' + item.id : ''),
      method: item?.id ? 'PATCH' : 'POST',
      body,
    });
    await draft.clear();
    onClose();
  };
  const save = () =>
    item?.id
      ? guard.run(
          item,
          () =>
            findCoachResource(item.id, async (cursor) => {
              const page = await createApiClient(auth).get<{ items: CoachLibraryItem[]; nextCursor?: string }>(
                coachLibraryQueryPath(category, '', cursor ?? '', {}),
              );
              return { data: page.items, nextCursor: page.nextCursor };
            }),
          persist,
        )
      : persist();
  return { t, write, upload, catalogs, draft, value, set, fields, referenceFields, save, guard };
}
function LibraryEditorView({
  category,
  onClose,
  t,
  write,
  upload,
  catalogs,
  draft,
  value,
  set,
  fields,
  referenceFields,
  save,
  guard,
}: LibraryEditorProps & ReturnType<typeof useLibraryEditor>) {
  return (
    <CoachPage title={t('coachWorkspace.library')} onBack={onClose}>
      <CoachConflict conflict={draft.conflict || guard.conflict} onDiscard={() => void draft.clear().then(onClose)} />
      {fields.map((key) => (
        <CoachField
          key={key}
          label={t('coachWorkspace.field.' + key)}
          value={Array.isArray(value[key]) ? (value[key] as string[]).join(', ') : String(value[key] ?? '')}
          onChange={(next) => set(key, next)}
          multiline={key.includes('nstructions') || key === 'notes'}
        />
      ))}
      <LibrarySpecialFields
        category={category}
        catalogs={catalogs}
        value={value}
        set={set}
        referenceFields={referenceFields}
      />
      <CoachButton
        label={t('coachWorkspace.upload')}
        loading={upload.isPending}
        onPress={() =>
          void upload
            .mutateAsync()
            .then((result) => {
              if (result) set('mediaUrl', result.imageUrl);
            })
            .catch(() => undefined)
        }
      />
      <CoachButton
        label={t('coachWorkspace.save')}
        disabled={!draft.ready || draft.conflict || guard.conflict || !String(value.name).trim()}
        loading={write.isPending || guard.busy}
        onPress={() => void save().catch(() => undefined)}
      />
    </CoachPage>
  );
}

function LibrarySpecialFields({
  category,
  catalogs,
  value,
  set,
  referenceFields,
}: Pick<ReturnType<typeof useLibraryEditor>, 'catalogs' | 'value' | 'set' | 'referenceFields'> & { category: string }) {
  const { t } = useTranslation();
  return category === 'foods' ? (
    <>
      <CoachSelect
        label={t('coachWorkspace.field.servingUnit')}
        value={String(value.servingUnit)}
        onChange={(next) => set('servingUnit', next)}
        options={['100g', '100ml', 'porcion'].map((v) => ({ value: v, label: v }))}
      />
      <CoachSelect
        label={t('coachWorkspace.field.foodType')}
        value={String(value.foodType ?? 'ingrediente')}
        onChange={(next) => set('foodType', next)}
        options={['ingrediente', 'plato'].map((v) => ({ value: v, label: t('coachWorkspace.' + v) }))}
      />
      {foodNumbers.map((key) => (
        <CoachField
          key={key}
          label={t('coachWorkspace.field.' + key)}
          value={String(value[key] ?? '')}
          onChange={(next) => set(key, next === '' ? null : Number(next.replace(',', '.')))}
          numeric
        />
      ))}
    </>
  ) : (
    <>
      <CoachStatus query={catalogs} />
      {referenceFields.map((key) => (
        <CoachSelect
          key={key}
          label={t('coachWorkspace.field.' + key)}
          value={String(value[key] ?? '')}
          onChange={(next) => set(key, next)}
          options={[
            { value: '', label: '—' },
            ...(catalogs.data?.[catalogFields[key] ?? ''] ?? []).map((c) => ({ value: c.id, label: c.label })),
          ]}
        />
      ))}
      {category === 'strength' ? (
        <View style={ui.card}>
          <Text style={ui.label}>{t('coachWorkspace.muscleGroups')}</Text>
          {(catalogs.data?.muscleGroups ?? []).map((group) => (
            <CoachButton
              key={group.id}
              label={(((value.muscleGroupIds as string[]) ?? []).includes(group.id) ? '✓ ' : '') + group.label}
              onPress={() =>
                set(
                  'muscleGroupIds',
                  ((value.muscleGroupIds as string[]) ?? []).includes(group.id)
                    ? (value.muscleGroupIds as string[]).filter((id) => id !== group.id)
                    : [...((value.muscleGroupIds as string[]) ?? []), group.id],
                )
              }
            />
          ))}
        </View>
      ) : null}
    </>
  );
}
