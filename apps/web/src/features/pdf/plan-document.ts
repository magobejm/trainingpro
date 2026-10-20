import { SET_VARIABLE_PRIORITY, setVariablesForType, usesMinuteDuration, toSetDisplayValue } from '@trainerpro/shared';
import type { DraftBlock, DraftSet, DraftState } from '../../screens/coach/RoutinePlanner.types';
import type { WarmupTemplateView } from '../../data/hooks/useWarmupTemplates';
import { mapWarmupTemplateItemsToBlocks } from '../../screens/coach/RoutinePlanner.template-mapper';
import type { PdfSection } from './pdf-model';
export { nutritionPdfSections } from './nutrition-document';

export type PdfTranslate = (key: string) => string;
const fields: Array<{ key: keyof DraftSet; unit?: string }> = [
  ...SET_VARIABLE_PRIORITY.map((key) => ({
    key,
    unit: (
      {
        weightKg: 'kg',
        durationSeconds: 's',
        distanceMeters: 'km',
        fcMaxPct: '%',
        fcReservePct: '%',
        heartRate: 'bpm',
        restSeconds: 's',
      } as Record<string, string>
    )[key],
  })),
  { key: 'advancedTechnique' },
  { key: 'note' },
];
const present = (value: unknown) => value !== undefined && value !== null && value !== '';

export function routinePdfSections(draft: DraftState, warmups: WarmupTemplateView[], t: PdfTranslate): PdfSection[] {
  const sections: PdfSection[] = [];
  for (const day of draft.days) {
    sections.push({ heading: day.title, paragraphs: [day.notesTitle, day.notes].filter((s): s is string => Boolean(s)) });
    for (const ref of day.warmupTemplates ?? []) {
      const template = warmups.find((entry) => entry.id === ref.id);
      sections.push({
        heading: `${t('web.pdf.warmup')}: ${ref.name}`,
        paragraphs: template ? [] : [t('web.pdf.unavailable')],
      });
      if (template) sections.push(...groupedSections(warmupBlocks(template), template.groups, t));
    }
    sections.push(...groupedSections(day.blocks, day.groups ?? [], t));
  }
  if (draft.neats?.length)
    sections.push({
      heading: 'NEAT',
      paragraphs: draft.neats.map((n) => [n.title, n.description].filter(Boolean).join(': ')),
    });
  return sections;
}

function groupedSections(
  blocks: DraftBlock[],
  groups: Array<{ id: string; groupType: string; note?: string | null }>,
  t: PdfTranslate,
): PdfSection[] {
  const sections: PdfSection[] = [];
  const seen = new Set<string>();
  for (const block of blocks) {
    const group = groups.find((entry) => entry.id === block.groupId);
    if (group && !seen.has(group.id)) {
      sections.push({ heading: t(`web.pdf.${group.groupType}`), paragraphs: group.note ? [group.note] : [] });
      seen.add(group.id);
    }
    sections.push(blockSection(block, t));
  }
  return sections;
}

function blockSection(block: DraftBlock, t: PdfTranslate): PdfSection {
  const count = Math.max(
    block.setsPlanned ?? block.roundsPlanned ?? 0,
    block.sets?.length ?? 0,
    usesMinuteDuration(block.type) && (block.workSeconds != null || block.durationMinutes != null) ? 1 : 0,
  );
  const sets = Array.from({ length: count }, (_, index) => resolvedSet(block, index));
  const active = fields.filter(
    ({ key }) =>
      (key === 'advancedTechnique' || key === 'note' || setVariablesForType(block.type).includes(key as never)) &&
      sets.some((set) => present(set[key])),
  );
  const paragraphs = block.notes ? [block.notes] : [];
  if (block.repsRange) paragraphs.push(`${t('web.pdf.repsRange')}: ${block.repsRange}`);
  if (!usesMinuteDuration(block.type) && block.durationMinutes != null)
    paragraphs.push(`${t('web.pdf.totalTime')}: ${block.durationMinutes} min`);
  if (!sets.length) paragraphs.push(t('web.pdf.noSets'));
  return {
    heading: block.displayName,
    paragraphs,
    ...(sets.length
      ? {
          table: {
            columns: [
              t('web.pdf.set'),
              ...active.map(
                ({ key, unit }) =>
                  `${t(`web.pdf.${key}`)}${unit ? ` (${key === 'durationSeconds' && usesMinuteDuration(block.type) ? 'min' : unit})` : ''}`,
              ),
            ],
            rows: sets.map((set, index) => [
              index + 1,
              ...active.map(({ key }) =>
                fieldValue(
                  key,
                  typeof set[key] === 'number' ? toSetDisplayValue(block.type, key, set[key] as number) : set[key],
                  t,
                ),
              ),
            ]),
            identifyingColumns: 1,
          },
        }
      : {}),
  };
}

function fieldValue(key: keyof DraftSet, value: unknown, t: PdfTranslate): string {
  if (!present(value)) return '—';
  if (key !== 'advancedTechnique') return String(value);
  const translationKey = `coach.routine.advancedTechnique.${value}`;
  const label = t(translationKey);
  return label === translationKey ? String(value) : label;
}

function csv(value: string | undefined, index: number): number | undefined {
  const cell = value?.split(',')[index]?.trim();
  return cell && Number.isFinite(Number(cell)) ? Number(cell) : undefined;
}

function resolvedSet(block: DraftBlock, index: number): DraftSet {
  const set = block.sets?.find((entry) => entry.setIndex === index);
  return {
    setIndex: index,
    reps: set?.reps ?? csv(block.repsPerSeries, index) ?? block.repsPlanned,
    weightKg: set?.weightKg ?? csv(block.weightPerSeriesKg, index) ?? block.weightKg,
    distanceMeters: set?.distanceMeters,
    durationSeconds:
      set?.durationSeconds ??
      block.totalTimeSeconds ??
      block.workSeconds ??
      (block.type === 'sport' && block.durationMinutes != null ? block.durationMinutes * 60 : undefined),
    rpe: set?.rpe ?? block.targetRpe,
    rir: set?.rir ?? block.targetRir,
    fcMaxPct: set?.fcMaxPct ?? block.intensityFcMax,
    fcReservePct: set?.fcReservePct ?? block.intensityFcReserve,
    heartRate: set?.heartRate ?? block.heartRate,
    restSeconds: set?.restSeconds ?? block.restSeconds,
    rom: set?.rom,
    advancedTechnique: set?.advancedTechnique,
    note: set?.note,
  };
}

function warmupBlocks(template: WarmupTemplateView): DraftBlock[] {
  let sequence = 0;
  return [...template.items]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => {
      const meta = warmupMetadata(item);
      const number = (key: string) => (typeof meta[key] === 'number' ? (meta[key] as number) : undefined);
      const normalized = {
        ...item,
        weightRangeMaxKg: number('pesoKg'),
        repsMax: item.repsMax ?? number('repeticiones'),
        notes: `${(item.notes ?? '').split('[meta]')[0]?.trim() ?? ''}\n[meta] ${JSON.stringify(meta)}`,
      };
      const mapped = mapWarmupTemplateItemsToBlocks(
        [normalized],
        (type, displayName) => ({ id: '', type, displayName }),
        () => `pdf-warmup-${sequence++}`,
      )[0]!;
      return {
        ...mapped,
        repsPlanned: mapped.repsPlanned ?? number('repeticiones'),
        weightKg: mapped.weightKg ?? number('pesoKg'),
        workSeconds: mapped.workSeconds ?? item.workSeconds ?? undefined,
        targetRir: mapped.targetRir ?? item.targetRir ?? undefined,
        durationMinutes: mapped.durationMinutes ?? item.durationMinutes ?? undefined,
      };
    });
}

function warmupMetadata(item: WarmupTemplateView['items'][number]): Record<string, unknown> {
  const marker = (item.notes ?? '').lastIndexOf('[meta]');
  let noteMetadata: Record<string, unknown> = {};
  if (marker >= 0) {
    try {
      const parsed: unknown = JSON.parse(item.notes!.slice(marker + '[meta]'.length));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) noteMetadata = parsed as Record<string, unknown>;
    } catch {
      /* Keep structured metadata when legacy notes contain invalid JSON. */
    }
  }
  return { ...noteMetadata, ...item.metadataJson };
}
