import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WarmupTemplateGroupView, WarmupTemplateItemInput } from '../../../../data/hooks/useWarmupTemplates';
import { useUnifiedExercisesQuery, type UnifiedExerciseItem } from '../../../../data/hooks/useUnifiedLibraryQuery';
import { UnifiedExerciseDetailModal } from '../../UnifiedExerciseDetailModal';
import { resolvePlaceholder } from './ExercisePickerModal.utils';
import type { BlockType } from '../../RoutinePlanner.types';

const ICON_DETAIL = '🔍';
const ICON_COLLAPSE = '▲';
const ICON_EXPAND = '▼';

const BLOCK_TYPE_LABELS: Record<string, string> = {
  cardio: 'Cardio',
  isometric: 'Isométrico',
  mobility: 'Movilidad',
  plio: 'Pliométrico',
  sport: 'Deporte',
  strength: 'Fuerza',
};

const BASE_CATEGORY_MAP: Record<string, string> = {
  strength: 'muscleGroups',
  cardio: 'cardioMethodTypes',
  isometric: 'isometricTypes',
  plio: 'plioTypes',
  mobility: 'mobilityTypes',
  sport: 'sportTypes',
};

function toBlockType(apiBlockType: string): BlockType {
  if (apiBlockType === 'mobility') return 'warmup';
  const valid: BlockType[] = ['strength', 'cardio', 'plio', 'isometric', 'sport', 'warmup'];
  return valid.includes(apiBlockType as BlockType) ? (apiBlockType as BlockType) : 'strength';
}

function resolveImageUrl(item: WarmupTemplateItemInput, libraryMediaUrl: string | null | undefined): string {
  if (libraryMediaUrl) return libraryMediaUrl;
  return resolvePlaceholder(toBlockType(item.blockType));
}

function resolveLibraryId(item: WarmupTemplateItemInput): string | null {
  if (item.exerciseLibraryId) return item.exerciseLibraryId;
  if (item.warmupExerciseLibraryId) return item.warmupExerciseLibraryId;
  if (item.cardioMethodLibraryId) return item.cardioMethodLibraryId;
  if (item.plioExerciseLibraryId) return item.plioExerciseLibraryId;
  if (item.isometricExerciseLibraryId) return item.isometricExerciseLibraryId;
  if (item.sportLibraryId) return item.sportLibraryId;
  return null;
}

type PerSet = {
  setIndex: number;
  reps?: number;
  rpe?: number;
  weightKg?: number;
  rir?: number;
  restSeconds?: number;
  rom?: string;
};

function parseSets(item: WarmupTemplateItemInput): PerSet[] {
  const raw = (item.metadataJson as Record<string, unknown> | null | undefined)?.sets;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => s !== null && typeof s === 'object')
    .map((s, i) => ({
      setIndex: typeof s.setIndex === 'number' ? s.setIndex : i,
      reps: typeof s.reps === 'number' ? s.reps : undefined,
      rpe: typeof s.rpe === 'number' ? s.rpe : undefined,
      weightKg: typeof s.weightKg === 'number' ? s.weightKg : undefined,
      rir: typeof s.rir === 'number' ? s.rir : undefined,
      restSeconds: typeof s.restSeconds === 'number' ? s.restSeconds : undefined,
      rom: typeof s.rom === 'string' && s.rom ? s.rom : undefined,
    }));
}

interface Props {
  items: WarmupTemplateItemInput[];
  groups: WarmupTemplateGroupView[];
}

const RESIZE_COVER = 'cover' as const;

export function WarmupExerciseList({ items, groups }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [detailItem, setDetailItem] = useState<UnifiedExerciseItem | null>(null);

  const sortedItems = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const renderedGroups = new Set<string>();
  const elements: React.ReactNode[] = [];

  sortedItems.forEach((item, idx) => {
    if (item.groupId && !renderedGroups.has(item.groupId)) {
      const group = groups.find((g) => g.id === item.groupId);
      if (group) {
        renderedGroups.add(group.id);
        const groupItems = sortedItems.filter((i) => i.groupId === group.id);
        elements.push(
          <View key={`group-${group.id}`} style={el.circuitBox}>
            <Text style={el.circuitLabel}>{t('coach.warmupExerciseList.circuit')}</Text>
            {groupItems.map((gi, giIdx) => (
              <ExerciseRow key={`${gi.groupId}-${giIdx}`} item={gi} onShowDetail={setDetailItem} />
            ))}
          </View>,
        );
        return;
      }
    }
    if (item.groupId) return;
    elements.push(<ExerciseRow key={`item-${idx}`} item={item} onShowDetail={setDetailItem} />);
  });

  if (elements.length === 0) {
    return (
      <View style={el.empty}>
        <Text style={el.emptyText}>{t('coach.routine.day.noExercises')}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={el.container}>{elements}</View>
      <UnifiedExerciseDetailModal item={detailItem} onClose={() => setDetailItem(null)} visible={detailItem !== null} />
    </>
  );
}

function ExerciseRow({
  item,
  onShowDetail,
}: {
  item: WarmupTemplateItemInput;
  onShowDetail: (item: UnifiedExerciseItem) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const libraryId = resolveLibraryId(item);
  const baseCategory = BASE_CATEGORY_MAP[item.blockType] ?? 'muscleGroups';

  const { data: results = [] } = useUnifiedExercisesQuery({ baseCategory, search: item.displayName });
  const libraryItem = results.find((r) => r.id === libraryId || r.name === item.displayName) ?? null;
  const imageUrl = resolveImageUrl(item, libraryItem?.mediaUrl);

  return (
    <View style={el.row}>
      {/* Header */}
      <View style={el.rowHeader}>
        <Text style={el.rowName} numberOfLines={2}>
          {item.displayName}
        </Text>
        <View style={el.rowActions}>
          <View style={el.typeBadge}>
            <Text style={el.typeBadgeText}>{BLOCK_TYPE_LABELS[item.blockType] ?? item.blockType}</Text>
          </View>
          {libraryItem && (
            <Pressable onPress={() => onShowDetail(libraryItem)} style={el.actionBtn}>
              <Text style={el.actionBtnText}>{ICON_DETAIL}</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setExpanded((v) => !v)} style={el.actionBtn}>
            <Text style={el.actionBtnText}>{expanded ? ICON_COLLAPSE : ICON_EXPAND}</Text>
          </Pressable>
        </View>
      </View>

      {/* Body */}
      {expanded && <ExerciseBody item={item} imageUrl={imageUrl} />}
    </View>
  );
}

function ExerciseBody({ item, imageUrl }: { item: WarmupTemplateItemInput; imageUrl: string }) {
  const { t } = useTranslation();
  const sets = parseSets(item);
  const hasSetData = sets.length > 0;

  const series = item.setsPlanned ?? item.roundsPlanned;
  const repsRange =
    item.repsMin != null || item.repsMax != null
      ? item.repsMin === item.repsMax
        ? String(item.repsMin ?? item.repsMax)
        : `${item.repsMin ?? '?'} - ${item.repsMax ?? '?'}`
      : null;

  const globalChips: Array<{ label: string; value: string }> = [];
  if (series) globalChips.push({ label: 'Series', value: String(series) });
  if (repsRange) globalChips.push({ label: 'Rango de repeticiones', value: repsRange });
  if (item.workSeconds) globalChips.push({ label: 'Trabajo', value: `${item.workSeconds}s` });
  if (!hasSetData && item.restSeconds) globalChips.push({ label: 'Descanso', value: `${item.restSeconds}s` });
  if (item.durationMinutes) globalChips.push({ label: 'Duración', value: `${item.durationMinutes} min` });
  if (!hasSetData && item.targetRpe != null) globalChips.push({ label: 'RPE', value: String(item.targetRpe) });
  if (!hasSetData && item.targetRir != null) globalChips.push({ label: 'RIR', value: String(item.targetRir) });

  const hasReps = sets.some((s) => s.reps != null);
  const hasRpe = sets.some((s) => s.rpe != null);
  const hasRom = sets.some((s) => s.rom != null);
  const hasWeight = sets.some((s) => s.weightKg != null);
  const hasRir = sets.some((s) => s.rir != null);
  const hasRest = sets.some((s) => s.restSeconds != null);

  return (
    <View style={el.body}>
      {/* Top section: image + global chips */}
      <View style={el.bodyTop}>
        <Image source={{ uri: imageUrl }} style={el.image} resizeMode={RESIZE_COVER} />
        {globalChips.length > 0 && (
          <View style={el.globalChips}>
            {globalChips.map((c) => (
              <View key={c.label} style={el.chipField}>
                <Text style={el.chipLabel}>{c.label}</Text>
                <Text style={el.chipValue}>{c.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Per-set table */}
      {hasSetData && (
        <View style={el.setsSection}>
          <Text style={el.setsTitle}>{t('coach.warmupExerciseList.seriesTitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header */}
              <View style={el.tableHeaderRow}>
                <Text style={[el.tableCell, el.tableCellSerie, el.tableHeaderText]}>
                  {t('coach.routine.seriesTable.seriesCol')}
                </Text>
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.seriesTable.col.reps')}</Text>
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.block.rpe')}</Text>
                {hasRom && <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.warmupExerciseList.colRom')}</Text>}
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.block.weightKg')}</Text>
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.block.rest')}</Text>
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.block.rir')}</Text>
              </View>
              {/* Rows */}
              {sets.map((s) => (
                <View key={s.setIndex} style={el.tableRow}>
                  <Text style={[el.tableCell, el.tableCellSerie, el.tableCellValue]}>{s.setIndex + 1}</Text>
                  <Text style={[el.tableCell, el.tableCellValue]}>{hasReps ? (s.reps ?? '—') : '—'}</Text>
                  <Text style={[el.tableCell, el.tableCellValue]}>{hasRpe ? (s.rpe ?? '—') : '—'}</Text>
                  {hasRom && <Text style={[el.tableCell, el.tableCellValue]}>{s.rom ?? '—'}</Text>}
                  <Text style={[el.tableCell, el.tableCellValue]}>
                    {hasWeight ? (s.weightKg != null ? s.weightKg : '—') : '—'}
                  </Text>
                  <Text style={[el.tableCell, el.tableCellValue]}>
                    {hasRest ? (s.restSeconds != null ? s.restSeconds : '—') : '—'}
                  </Text>
                  <Text style={[el.tableCell, el.tableCellValue]}>{hasRir ? (s.rir ?? '—') : '—'}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Notes */}
      {item.notes ? (
        <View style={el.notesRow}>
          <Text style={el.notesLabel}>{t('coach.routine.block.notes')}</Text>
          <Text style={el.notesText}>{item.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

const el = {
  container: { paddingBottom: 8 },
  empty: { padding: 16 },
  emptyText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' as const },

  /* Exercise row */
  row: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 14,
  },
  rowHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    marginBottom: 8,
  },
  rowName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0f172a',
    lineHeight: 18,
  },
  rowActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    flexShrink: 0,
  },
  typeBadge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' as const, color: '#0369a1' },
  actionBtn: { paddingHorizontal: 5, paddingVertical: 2 },
  actionBtnText: { fontSize: 14, color: '#64748b' },

  /* Body */
  body: { gap: 10 },
  bodyTop: {
    flexDirection: 'row' as const,
    gap: 12,
    alignItems: 'flex-start' as const,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    flexShrink: 0,
  },
  globalChips: {
    flex: 1,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
    alignItems: 'flex-start' as const,
  },
  chipField: { gap: 2 },
  chipLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500' as const,
  },
  chipValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1e293b',
    lineHeight: 24,
  },

  /* Sets section */
  setsSection: { gap: 6 },
  setsTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#64748b',
    letterSpacing: 0.8,
  },
  tableHeaderRow: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row' as const,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: {
    width: 90,
    textAlign: 'center' as const,
    paddingHorizontal: 4,
  },
  tableCellSerie: { width: 52 },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#94a3b8',
  },
  tableCellValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1e293b',
  },

  /* Notes */
  notesRow: { gap: 2 },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#3b82f6',
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },

  /* Circuit */
  circuitBox: {
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    marginVertical: 4,
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
  circuitLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#1d4ed8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
};
