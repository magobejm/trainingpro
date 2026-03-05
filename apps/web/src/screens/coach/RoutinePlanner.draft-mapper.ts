import type { BlockType, DraftBlock, DraftState } from './RoutinePlanner.types';
import { mapTemplateBlock } from './RoutinePlanner.template-mapper';

type TemplateBlockData = {
  displayName: string;
  sortOrder: number;
  [key: string]: unknown;
};

type TemplateDayData = {
  title: string;
  exercises?: TemplateBlockData[];
  cardioBlocks?: TemplateBlockData[];
  plioBlocks?: TemplateBlockData[];
  warmupBlocks?: TemplateBlockData[];
  sportBlocks?: TemplateBlockData[];
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
      id: nextDayId(),
      title: day.title,
    })),
    expectedCompletionDays: readExpectedCompletionDays(tpl),
    name: tpl.name,
    objectiveIds: readObjectiveIds(tpl),
    scope: tpl.scope as 'COACH' | 'GLOBAL',
  };
}

function mapBlocksFromTemplate(
  day: TemplateDayData,
  createBlock: (type: BlockType, displayName: string) => DraftBlock,
): DraftBlock[] {
  const blockTypes: BlockType[] = ['strength', 'cardio', 'plio', 'warmup', 'sport'];
  const blockKeys: (keyof TemplateDayData)[] = [
    'exercises',
    'cardioBlocks',
    'plioBlocks',
    'warmupBlocks',
    'sportBlocks',
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
  const value = (tpl as TemplateData & { expectedCompletionDays?: null | number })
    .expectedCompletionDays;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readObjectiveIds(tpl: TemplateData): string[] {
  const values = (tpl as TemplateData & { objectiveIds?: unknown }).objectiveIds;
  if (!Array.isArray(values)) {
    return [];
  }
  return values.filter((item): item is string => typeof item === 'string');
}
