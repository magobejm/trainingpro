import { useCoachEditor } from './useCoachEditor';
import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import type { CoachNutritionMeal as NutritionMeal, CoachNutritionPlan as NutritionPlan } from '@trainerpro/shared';
import { useTranslation } from 'react-i18next';
import { useCoachQuery, useCoachWrite } from '../../data/hooks/useCoachData';
import { CoachButton, CoachField, CoachSelect, CoachStatus, confirmCoachDelete, ui } from './CoachUi';
import { CoachLibraryScreen } from './CoachLibraryScreen';
import { NutritionMealEditor } from './coach-nutrition-meal';
import { NutritionPlanEditor } from './coach-nutrition-plan';
import { useNutritionCopy } from './coach-nutrition-copy';
import { duplicateNutritionResource, type NutritionDraftOrigin } from './coach-nutrition-model';
import { CoachClientNutrition } from './CoachClientNutrition';
import { NutritionCardMenu, NutritionMealFacts, NutritionPlanFacts } from './coach-nutrition-cards';

type Selection =
  | { kind: 'meal'; meal?: NutritionMeal & NutritionDraftOrigin }
  | { kind: 'plan'; plan?: NutritionPlan & NutritionDraftOrigin }
  | null;
type HubItem = NutritionMeal | NutritionPlan;
const FOODS_CATEGORY = 'foods';

export function CoachNutritionScreen({ clientId }: { clientId?: string }): React.JSX.Element {
  const c = useNutritionCopy();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'foods' | 'meals' | 'plans'>('plans');
  const [search, setSearch] = useState('');
  const [assigned, setAssigned] = useState(Boolean(clientId));
  const [menuId, setMenuId] = useState<string | null>(null);
  const { value: selection, select: setSelection, close: closeEditor } = useCoachEditor<Exclude<Selection, null>>();
  const meals = useCoachQuery<{ items: NutritionMeal[] }>('/nutrition/meals');
  const plans = useCoachQuery<{ items: NutritionPlan[] }>(planPath(assigned, clientId));
  const write = useCoachWrite();
  if (selection?.kind === 'meal') {
    return <NutritionMealEditor key={selection.meal?.id || 'new'} meal={selection.meal} onClose={closeEditor} />;
  }
  if (selection?.kind === 'plan') {
    return (
      <NutritionPlanEditor
        key={selection.plan?.id || 'new'}
        clientId={assigned ? clientId : undefined}
        onClose={closeEditor}
        plan={selection.plan}
      />
    );
  }
  if (tab === 'foods') {
    return (
      <View style={ui.page}>
        <CoachButton label={c('back')} onPress={() => setTab('plans')} />
        <CoachLibraryScreen initialCategory={FOODS_CATEGORY} />
      </View>
    );
  }
  const query = tab === 'plans' ? plans : meals;
  const rows = (query.data?.items ?? []).filter((item) =>
    item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  return (
    <FlatList
      contentContainerStyle={ui.content}
      data={rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <NutritionHubHeader
          assigned={assigned}
          clientId={clientId}
          search={search}
          setAssigned={setAssigned}
          setSearch={setSearch}
          setTab={setTab}
          tab={tab}
          onCreate={() => setSelection(tab === 'plans' ? { kind: 'plan' } : { kind: 'meal' })}
          query={query}
          empty={rows.length === 0}
        />
      }
      renderItem={({ item }) => (
        <NutritionHubCard
          item={item}
          menuOpen={menuId === item.id}
          tab={tab}
          onDelete={() =>
            confirmCoachDelete(item.name, () => write.mutate({ method: 'DELETE', path: `/nutrition/${tab}/${item.id}` }), t)
          }
          onDuplicate={() => openDuplicate(item, tab, c('copy'), setSelection)}
          onEdit={() =>
            setSelection(
              tab === 'plans'
                ? { kind: 'plan', plan: item as NutritionPlan }
                : { kind: 'meal', meal: item as NutritionMeal },
            )
          }
          onToggle={() => setMenuId(menuId === item.id ? null : item.id)}
          pending={write.isPending}
        />
      )}
      style={ui.page}
    />
  );
}

function planPath(assigned: boolean, clientId?: string): string {
  return assigned && clientId ? `/nutrition/clients/${clientId}/plans` : '/nutrition/plans';
}

function openDuplicate(item: HubItem, tab: 'meals' | 'plans', copy: string, onSelect: (selection: Selection) => void): void {
  if (tab === 'plans') onSelect({ kind: 'plan', plan: duplicateNutritionResource(item as NutritionPlan, copy) });
  else onSelect({ kind: 'meal', meal: duplicateNutritionResource(item as NutritionMeal, copy) });
}

function NutritionHubHeader(props: {
  assigned: boolean;
  clientId?: string;
  empty: boolean;
  onCreate: () => void;
  query: ReturnType<typeof useCoachQuery>;
  search: string;
  setAssigned: (value: boolean) => void;
  setSearch: (value: string) => void;
  setTab: (value: 'foods' | 'meals' | 'plans') => void;
  tab: 'foods' | 'meals' | 'plans';
}): React.JSX.Element {
  const c = useNutritionCopy();
  return (
    <View style={ui.field}>
      {props.clientId ? <CoachClientNutrition clientId={props.clientId} /> : null}
      <Text style={ui.title}>{c('nutrition')}</Text>
      <CoachSelect
        label={c('category')}
        onChange={(value) => props.setTab(value as 'foods' | 'meals' | 'plans')}
        options={(['plans', 'meals', 'foods'] as const).map((value) => ({ label: c(value), value }))}
        value={props.tab}
      />
      {props.clientId && props.tab === 'plans' ? (
        <CoachSelect
          label={c('plans')}
          onChange={(value) => props.setAssigned(value === 'assigned')}
          options={[
            { label: c('assigned'), value: 'assigned' },
            { label: c('templates'), value: 'templates' },
          ]}
          value={props.assigned ? 'assigned' : 'templates'}
        />
      ) : null}
      <CoachField label={c('search')} onChange={props.setSearch} value={props.search} />
      <CoachButton label={c(props.tab === 'plans' ? 'newPlan' : 'newMeal')} onPress={props.onCreate} />
      <CoachStatus empty={props.empty} query={props.query} />
    </View>
  );
}

function NutritionHubCard(props: {
  item: HubItem;
  menuOpen: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onToggle: () => void;
  pending: boolean;
  tab: 'meals' | 'plans';
}): React.JSX.Element {
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{props.item.name}</Text>
      {props.tab === 'plans' ? (
        <NutritionPlanFacts plan={props.item as NutritionPlan} />
      ) : (
        <NutritionMealFacts meal={props.item as NutritionMeal} />
      )}
      <NutritionCardMenu
        onDelete={props.onDelete}
        onDuplicate={props.onDuplicate}
        onEdit={props.onEdit}
        onToggle={props.onToggle}
        open={props.menuOpen}
        pending={props.pending}
      />
    </View>
  );
}
