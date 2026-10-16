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
type Selection =
  | { kind: 'meal'; meal?: NutritionMeal & NutritionDraftOrigin }
  | { kind: 'plan'; plan?: NutritionPlan & NutritionDraftOrigin }
  | null;
export function CoachNutritionScreen({ clientId }: { clientId?: string }) {
  const c = useNutritionCopy();
  const [tab, setTab] = useState<'plans' | 'meals' | 'foods'>('plans');
  const [search, setSearch] = useState('');
  const [assigned, setAssigned] = useState(Boolean(clientId));
  const { value: selection, select: setSelection, close: closeEditor } = useCoachEditor<Exclude<Selection, null>>();
  const meals = useCoachQuery<{ items: NutritionMeal[] }>('/nutrition/meals');
  const plans = useCoachQuery<{ items: NutritionPlan[] }>(
    assigned && clientId ? '/nutrition/clients/' + clientId + '/plans' : '/nutrition/plans',
  );
  const write = useCoachWrite();
  if (selection?.kind === 'meal')
    return <NutritionMealEditor key={selection.meal?.id || 'new'} meal={selection.meal} onClose={closeEditor} />;
  if (selection?.kind === 'plan')
    return (
      <NutritionPlanEditor
        key={selection.plan?.id || 'new'}
        plan={selection.plan}
        clientId={assigned ? clientId : undefined}
        onClose={closeEditor}
      />
    );
  if (tab === 'foods')
    return (
      <View style={ui.page}>
        <CoachButton label={c('back')} onPress={() => setTab('plans')} />
        <CoachLibraryScreen initialCategory={'foods'} />
      </View>
    );
  const query = tab === 'plans' ? plans : meals;
  const rows = (query.data?.items ?? []).filter((item) =>
    item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  return (
    <FlatList
      style={ui.page}
      contentContainerStyle={ui.content}
      data={rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={ui.field}>
          <Text style={ui.title}>{c('nutrition')}</Text>
          <CoachSelect
            label={c('category')}
            value={tab}
            onChange={(v) => setTab(v as typeof tab)}
            options={(['plans', 'meals', 'foods'] as const).map((v) => ({ value: v, label: c(v) }))}
          />
          {clientId && tab === 'plans' ? (
            <CoachSelect
              label={c('plans')}
              value={assigned ? 'assigned' : 'templates'}
              onChange={(v) => setAssigned(v === 'assigned')}
              options={[
                { value: 'assigned', label: c('assigned') },
                { value: 'templates', label: c('templates') },
              ]}
            />
          ) : null}
          <CoachField label={c('search')} value={search} onChange={setSearch} />
          <CoachButton
            label={c(tab === 'plans' ? 'newPlan' : 'newMeal')}
            onPress={() => setSelection(tab === 'plans' ? { kind: 'plan' } : { kind: 'meal' })}
          />
          <CoachStatus query={query} empty={rows.length === 0} />
        </View>
      }
      renderItem={({ item }) => <NutritionHubItem item={item} tab={tab} write={write} onSelect={setSelection} />}
    />
  );
}

function NutritionHubItem({
  item,
  tab,
  write,
  onSelect,
}: {
  item: NutritionMeal | NutritionPlan;
  tab: 'plans' | 'meals';
  write: ReturnType<typeof useCoachWrite>;
  onSelect: (selection: Selection) => void;
}) {
  const c = useNutritionCopy();
  const { t } = useTranslation();
  return (
    <View style={ui.card}>
      <Text style={ui.label}>{item.name}</Text>
      <CoachButton
        label={c('edit')}
        onPress={() =>
          onSelect(
            tab === 'plans' ? { kind: 'plan', plan: item as NutritionPlan } : { kind: 'meal', meal: item as NutritionMeal },
          )
        }
      />
      <CoachButton
        label={c('duplicate')}
        onPress={() =>
          onSelect(
            tab === 'plans'
              ? { kind: 'plan', plan: duplicateNutritionResource(item as NutritionPlan, c('copy')) }
              : { kind: 'meal', meal: duplicateNutritionResource(item as NutritionMeal, c('copy')) },
          )
        }
      />
      <CoachButton
        danger
        label={c('delete')}
        disabled={write.isPending}
        onPress={() =>
          confirmCoachDelete(
            item.name,
            () => write.mutate({ path: '/nutrition/' + tab + '/' + item.id, method: 'DELETE' }),
            t,
          )
        }
      />
    </View>
  );
}
