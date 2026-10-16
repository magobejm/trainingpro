import {
  canAssignCoachNutritionPlan,
  saveCoachNutritionPlan,
  nutritionSaveTarget,
  type NutritionPublication,
  type NutritionPlanDraft,
} from './coach-nutrition-save';
import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type {
  ClientListResponse,
  CoachNutritionMeal as NutritionMeal,
  CoachNutritionPlan as NutritionPlan,
  CoachPlanWriteInput as PlanWriteInput,
  CoachNutritionCheckpoint as NutritionCheckpoint,
} from '@trainerpro/shared';
import { useCoachAuth, useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import { createApiClient } from '../../data/api-client';
import { CoachButton, CoachField, CoachPage, CoachSelect, CoachStatus, ui } from './CoachUi';
import { CoachPdfButton } from './CoachPdfButton';
import { NutritionSetupEditor, defaultNutritionSetup } from './coach-nutrition-setup';
import { StructuredNutritionContent, FreeNutritionContent } from './coach-nutrition-content';
import { useNutritionCopy } from './coach-nutrition-copy';
import {
  nutritionDocument,
  nutritionPlanPayload,
  nutritionVersion,
  readFreeContent,
  nutritionDraftKey,
  type NutritionDraftOrigin,
} from './coach-nutrition-model';
type PlanEditorProps = { plan?: NutritionPlan & NutritionDraftOrigin; onClose: () => void; clientId?: string };
export function NutritionPlanEditor(props: PlanEditorProps) {
  return <NutritionPlanView {...useNutritionPlanModel(props)} {...props} />;
}
function useNutritionPlanModel({ plan, onClose, clientId }: PlanEditorProps) {
  const c = useNutritionCopy();
  const auth = useCoachAuth();
  const write = useCoachWrite<NutritionPlan>();
  const meals = useCoachQuery<{ items: NutritionMeal[] }>('/nutrition/meals');
  const [error, setError] = useState('');
  const [changed, setChanged] = useState(false);
  const published = useRef<NutritionPublication | undefined>(undefined);
  const saving = useRef(false);
  const [selectedClient, setSelectedClient] = useState(clientId ?? '');
  const clients = useCoachQuery<ClientListResponse>('/clients');
  const initial: PlanWriteInput = plan
    ? nutritionPlanPayload(plan)
    : {
        name: '',
        description: '',
        strategy: '',
        type: 'ESTRUCTURADO',
        content: { weeks: [] },
        setupData: defaultNutritionSetup(),
      };
  const draft = useCoachDraft<NutritionPlanDraft>(
    nutritionDraftKey('plan', plan, clientId),
    initial,
    plan?.id ? nutritionVersion(plan) : undefined,
  );
  const value = draft.value;
  const set = (patch: Partial<PlanWriteInput>) => draft.setValue((old) => ({ ...old, ...patch }));
  const save = async (copy = false) => {
    if (saving.current) return;
    saving.current = true;
    try {
      setError('');
      if (
        !value.name.trim() ||
        hasInvalidSetup(value.setupData) ||
        (value.type === 'LIBRE' &&
          Object.values(readFreeContent(value.content).columns)
            .flat()
            .some((item) => item.type === 'food' && (!Number.isFinite(item.amountGrams) || Number(item.amountGrams) <= 0)))
      )
        throw new Error(c('invalid'));
      const publication = published.current ?? value.publication;
      if (plan?.id && !copy && !publication) {
        const path = plan.clientId ? '/nutrition/clients/' + plan.clientId + '/plans' : '/nutrition/plans';
        const latest = await createApiClient(auth).get<{ items: NutritionPlan[] }>(path);
        if (nutritionVersion(latest.items.find((item) => item.id === plan.id)) !== nutritionVersion(plan)) {
          setChanged(true);
          return;
        }
      }
      const target = nutritionSaveTarget({ originalId: plan?.id, copy, clientId, publication });
      await saveCoachNutritionPlan(
        {
          ...target,
          payload: nutritionPlanPayload(value),
        },
        write.mutateAsync,
        (saved) => {
          const publication = { id: saved.id, clientId: target.assignAfterSave ? target.clientId : undefined };
          published.current = publication;
          draft.setValue((current) => ({ ...current, publication }));
        },
        async (targetClientId) => {
          const result = await createApiClient(auth).get<{ items: NutritionPlan[] }>(
            '/nutrition/clients/' + targetClientId + '/plans',
          );
          return result.items;
        },
      );
      await draft.clear({ ...value, publication: published.current ?? value.publication });
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : c('invalid'));
    } finally {
      saving.current = false;
    }
  };
  return { c, write, meals, error, changed, selectedClient, setSelectedClient, clients, draft, value, set, save };
}
function NutritionPlanView({
  plan,
  onClose,
  c,
  write,
  meals,
  error,
  changed,
  selectedClient,
  setSelectedClient,
  clients,
  draft,
  value,
  set,
  save,
}: PlanEditorProps & ReturnType<typeof useNutritionPlanModel>) {
  return (
    <CoachPage title={plan ? c('edit') : c('newPlan')} onBack={onClose}>
      <CoachField label={c('name')} value={value.name} onChange={(name) => set({ name })} />
      <CoachField
        multiline
        label={c('description')}
        value={value.description ?? ''}
        onChange={(description) => set({ description })}
      />
      <CoachField label={c('strategy')} value={value.strategy ?? ''} onChange={(strategy) => set({ strategy })} />
      <CoachSelect
        label={c('type')}
        value={value.type}
        onChange={(type) => set({ type: type as PlanWriteInput['type'] })}
        options={[
          { value: 'ESTRUCTURADO', label: c('structured') },
          { value: 'LIBRE', label: c('free') },
        ]}
      />
      <NutritionSetupEditor value={value.setupData} onChange={(setupData) => set({ setupData })} />
      <CoachStatus query={meals} />
      {value.type === 'ESTRUCTURADO' ? (
        <StructuredNutritionContent
          value={value.content}
          onChange={(content) => set({ content })}
          meals={meals.data?.items ?? []}
        />
      ) : (
        <FreeNutritionContent
          value={value.content}
          onChange={(content) => set({ content })}
          meals={meals.data?.items ?? []}
        />
      )}
      <CoachPdfButton title={value.name || c('nutrition')} sections={nutritionDocument(value, meals.data?.items ?? [])} />
      {draft.conflict || changed ? (
        <View style={ui.card}>
          <Text style={ui.error}>{c('conflict')}</Text>
          <CoachButton
            label={c('reload')}
            onPress={() => {
              void draft.clear();
              onClose();
            }}
          />
        </View>
      ) : null}
      {error ? (
        <Text accessibilityRole={'alert'} style={ui.error}>
          {error}
        </Text>
      ) : null}
      <CoachButton
        label={c('save')}
        disabled={!draft.ready || draft.conflict || changed}
        loading={write.isPending}
        onPress={() => void save()}
      />
      <CoachButton label={c('copy')} disabled={!draft.ready} loading={write.isPending} onPress={() => void save(true)} />
      {plan?.id ? (
        <NutritionSavedPlanActions
          plan={plan}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          clients={clients}
          write={write}
        />
      ) : null}
    </CoachPage>
  );
}
function NutritionSavedPlanActions({
  plan,
  selectedClient,
  setSelectedClient,
  clients,
  write,
}: { plan: NutritionPlan } & Pick<
  ReturnType<typeof useNutritionPlanModel>,
  'selectedClient' | 'setSelectedClient' | 'clients' | 'write'
>) {
  const c = useNutritionCopy();
  return (
    <>
      {canAssignCoachNutritionPlan(plan) ? (
        <>
          <CoachSelect
            label={c('chooseClient')}
            value={selectedClient}
            onChange={setSelectedClient}
            options={[
              { value: '', label: c('none') },
              ...(clients.data?.items ?? []).map((client) => ({
                value: client.id,
                label: client.firstName + ' ' + client.lastName,
              })),
            ]}
          />
          <CoachButton
            label={c('assign')}
            disabled={!selectedClient}
            loading={write.isPending}
            onPress={() =>
              write.mutate({ path: '/nutrition/plans/' + plan.id + '/assign', body: { clientId: selectedClient } })
            }
          />
        </>
      ) : null}
      <NutritionCheckpoints plan={plan} />
    </>
  );
}
function hasInvalidSetup(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(
    ([key, item]) =>
      ['age', 'heightCm', 'weightKg', 'targetCalories', 'proteinPct', 'carbsPct', 'fatPct'].includes(key) &&
      (typeof item !== 'number' || !Number.isFinite(item) || (key.endsWith('Pct') ? item < 0 || item > 100 : item <= 0)),
  );
}
function NutritionCheckpoints({ plan }: { plan: NutritionPlan }) {
  const c = useNutritionCopy();
  const query = useCoachQuery<{ items: NutritionCheckpoint[] }>('/nutrition/plans/' + plan.id + '/checkpoints');
  const write = useCoachWrite();
  const draft = useCoachDraft('nutrition-checkpoint:' + plan.id, { note: '', startDate: '', endDate: '' });
  const [error, setError] = useState('');
  const create = async () => {
    try {
      const toDate = (date: string) => (date ? new Date(date + 'T00:00:00').toISOString() : null);
      if (draft.value.startDate && draft.value.endDate && draft.value.startDate > draft.value.endDate)
        throw new Error(c('invalid'));
      await write.mutateAsync({
        path: '/nutrition/plans/' + plan.id + '/checkpoints',
        body: {
          content: plan.content,
          setupData: plan.setupData,
          planName: plan.name,
          note: draft.value.note || null,
          startDate: toDate(draft.value.startDate),
          endDate: toDate(draft.value.endDate),
        },
      });
      await draft.clear();
      setError('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : c('invalid'));
    }
  };
  return (
    <View style={ui.card}>
      <Text style={ui.title}>{c('checkpoints')}</Text>
      <CoachStatus query={query} />
      {(['note', 'startDate', 'endDate'] as const).map((key, index) => (
        <CoachField
          key={key}
          label={c((['notes', 'start', 'end'] as const)[index]!)}
          value={draft.value[key]}
          onChange={(value) => draft.setValue((old) => ({ ...old, [key]: value }))}
          multiline={key === 'note'}
        />
      ))}
      {error ? <Text style={ui.error}>{error}</Text> : null}
      <CoachButton label={c('checkpoint')} disabled={!draft.ready} loading={write.isPending} onPress={() => void create()} />
      {query.data?.items.map((checkpoint) => (
        <View key={checkpoint.id} style={ui.card}>
          <Text style={ui.label}>{new Date(checkpoint.createdAt).toLocaleDateString()}</Text>
          <Text style={ui.text}>{checkpoint.planName ?? plan.name}</Text>
          <Text style={ui.muted}>{checkpoint.note ?? ''}</Text>
          <CoachPdfButton
            title={checkpoint.planName ?? plan.name}
            sections={nutritionDocument(
              { ...nutritionPlanPayload(plan), content: checkpoint.content, setupData: checkpoint.setupData },
              [],
            )}
          />
        </View>
      ))}
    </View>
  );
}
