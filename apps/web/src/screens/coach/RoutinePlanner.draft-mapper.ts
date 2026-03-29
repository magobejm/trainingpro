import type { BlockType, DraftBlock, DraftExerciseGroup, DraftState, NeatItem } from './RoutinePlanner.types';
import { mapTemplateBlock } from './RoutinePlanner.template-mapper';

type TemplateBlockData = {
  displayName: string;
  sortOrder: number;
  [key: string]: unknown;
};

type TemplateGroupData = {
  id: string;
  groupType: string;
  note?: null | string;
  sortOrder: number;
};

type TemplateDayData = {
  title: string;
  exercises?: TemplateBlockData[];
  cardioBlocks?: TemplateBlockData[];
  plioBlocks?: TemplateBlockData[];
  warmupBlocks?: TemplateBlockData[];
  sportBlocks?: TemplateBlockData[];
  isometricBlocks?: TemplateBlockData[];
  groups?: TemplateGroupData[];
  warmupTemplates?: Array<{ id: string; name: string }>;
};

type TemplateData = {
  days: TemplateDayData[];
  name: string;
  scope: string;
};

export function mapTemplateToDraft(
  tpl: TemplateData,
  createBlock: (type: BlockType, displayName: string) => DraftBlock,
  nextDayId: () => string,
): DraftState {
  return {
    days: tpl.days.map((day) => ({
      blocks: mapBlocksFromTemplate(day, createBlock),
      groups: mapGroupsFromTemplate(day),
      id: nextDayId(),
      title: day.title,
      warmupTemplates: day.warmupTemplates ?? [],
    })),
    expectedCompletionDays: readExpectedCompletionDays(tpl),
    name: tpl.name,
    neats: readNeats(tpl),
    objectiveIds: readObjectiveIds(tpl),
    scope: tpl.scope as 'COACH' | 'GLOBAL',
  };
}

function mapGroupsFromTemplate(day: TemplateDayData): DraftExerciseGroup[] {
  if (!day.groups?.length) return [];
  return day.groups.map((g) => ({
    id: g.id,
    groupType: g.groupType as 'CIRCUIT' | 'SUPERSET',
    note: g.note ?? undefined,
    sortOrder: g.sortOrder,
  }));
}

function mapBlocksFromTemplate(
  day: TemplateDayData,
  createBlock: (type: BlockType, displayName: string) => DraftBlock,
): DraftBlock[] {
  const blockTypes: BlockType[] = ['strength', 'cardio', 'plio', 'warmup', 'sport', 'isometric'];
  const blockKeys: (keyof TemplateDayData)[] = [
    'exercises',
    'cardioBlocks',
    'plioBlocks',
    'warmupBlocks',
    'sportBlocks',
    'isometricBlocks',
  ];
  const blocks: DraftBlock[] = [];
  blockKeys.forEach((key, index) => {
    const type = blockTypes[index] as BlockType;
    const items = day[key] as TemplateBlockData[] | undefined;
    (items ?? []).forEach((item) => {
      blocks.push(mapTemplateBlock(type, item, createBlock));
    });
  });
  return blocks.sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

function readExpectedCompletionDays(tpl: TemplateData): null | number {
  const value = (tpl as TemplateData & { expectedCompletionDays?: null | number }).expectedCompletionDays;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readNeats(tpl: TemplateData): NeatItem[] {
  const values = (tpl as TemplateData & { neats?: unknown }).neats;
  if (!Array.isArray(values)) return [];
  let counter = Date.now();
  return values
    .filter(
      (item): item is { title: string; description?: string } => typeof (item as { title?: unknown }).title === 'string',
    )
    .map((item) => ({ id: `neat-${++counter}`, title: item.title, description: item.description ?? '' }));
}

function readObjectiveIds(tpl: TemplateData): string[] {
  const values = (tpl as TemplateData & { objectiveIds?: unknown }).objectiveIds;
  if (!Array.isArray(values)) {
    return [];
  }
  return values.filter((item): item is string => typeof item === 'string');
}
