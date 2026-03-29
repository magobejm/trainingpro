import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WarmupTemplateGroupView, WarmupTemplateItemInput } from '../../../../data/hooks/useWarmupTemplates';
import { useUnifiedExercisesQuery, type UnifiedExerciseItem } from '../../../../data/hooks/useUnifiedLibraryQuery';
import { UnifiedExerciseDetailModal } from '../../UnifiedExerciseDetailModal';
import {
  ACCESSIBILITY_ROLE_BUTTON,
  BASE_CATEGORY_MAP,
  BLOCK_TYPE_LABELS,
  ICON_COLLAPSE,
  ICON_DETAIL,
  ICON_EXPAND,
  ICON_SET_NOTE,
  RESIZE_COVER,
  TITLE_MAX_LINES,
} from './warmup-exercise-list.constants';
import {
  buildWarmupMainFieldChips,
  resolveDisplaySets,
  resolveImageUrl,
  resolveLibraryId,
} from './warmup-exercise-list.helpers';
import { el } from './warmup-exercise-list.styles';
import { WarmupBlockDetailModal, WarmupSetNoteModal } from './WarmupExerciseList.modals';

interface Props {
  items: WarmupTemplateItemInput[];
  groups: WarmupTemplateGroupView[];
}

const HIDE_H_SCROLL_INDICATOR = false;

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
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const [blockDetailOpen, setBlockDetailOpen] = useState(false);
  const [setNoteRowIdx, setSetNoteRowIdx] = useState<number | null>(null);
  const libraryId = resolveLibraryId(item);
  const baseCategory = BASE_CATEGORY_MAP[item.blockType] ?? 'muscleGroups';
  const displaySets = resolveDisplaySets(item);

  const { data: results = [] } = useUnifiedExercisesQuery({ baseCategory, search: item.displayName });
  const libraryItem = results.find((r) => r.id === libraryId || r.name === item.displayName) ?? null;
  const imageUrl = resolveImageUrl(item, libraryItem?.mediaUrl);

  return (
    <>
      <View style={el.row}>
        <View style={el.rowHeader}>
          <Text style={el.rowName} numberOfLines={TITLE_MAX_LINES}>
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

        {expanded && (
          <ExerciseBody
            item={item}
            imageUrl={imageUrl}
            onOpenBlockDetail={() => setBlockDetailOpen(true)}
            onOpenSetNote={(rowIdx) => setSetNoteRowIdx(rowIdx)}
          />
        )}
      </View>
      <WarmupBlockDetailModal
        item={item}
        libraryItem={libraryItem}
        onClose={() => setBlockDetailOpen(false)}
        visible={blockDetailOpen}
      />
      <WarmupSetNoteModal
        note={setNoteRowIdx != null ? displaySets[setNoteRowIdx]?.note : undefined}
        onClose={() => setSetNoteRowIdx(null)}
        setNumber={setNoteRowIdx != null ? setNoteRowIdx + 1 : 1}
        t={t}
        visible={setNoteRowIdx !== null}
      />
    </>
  );
}

function ExerciseBody({
  item,
  imageUrl,
  onOpenBlockDetail,
  onOpenSetNote,
}: {
  item: WarmupTemplateItemInput;
  imageUrl: string;
  onOpenBlockDetail: () => void;
  onOpenSetNote: (rowIdx: number) => void;
}) {
  const { t } = useTranslation();
  const sets = resolveDisplaySets(item);
  const ph = t('coach.routine.seriesTable.placeholderDash');

  const globalChips = buildWarmupMainFieldChips(item, t);

  const hasReps = sets.some((s) => s.reps != null);
  const hasRpe = sets.some((s) => s.rpe != null);
  const hasRom = sets.some((s) => s.rom != null);
  const hasWeight = sets.some((s) => s.weightKg != null);
  const hasRir = sets.some((s) => s.rir != null);
  const hasRest = sets.some((s) => s.restSeconds != null);

  return (
    <View style={el.body}>
      <View style={el.bodyTopRow}>
        <View style={el.mobilityImageCol}>
          <Image source={{ uri: imageUrl }} style={el.image} resizeMode={RESIZE_COVER} />
          <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={onOpenBlockDetail} style={el.linkUnderImage}>
            <Text style={el.linkUnderImageText}>{t('coach.routine.block.notes')}</Text>
          </Pressable>
        </View>
        <View style={el.globalChips}>
          {globalChips.map((c) => (
            <View key={c.label} style={el.chipField}>
              <Text style={el.chipLabel}>{c.label}</Text>
              <Text style={el.chipValue}>{c.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {sets.length > 0 && (
        <View style={el.setsSection}>
          <Text style={el.setsTitle}>{t('coach.warmupExerciseList.seriesTitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={HIDE_H_SCROLL_INDICATOR}>
            <View>
              <View style={el.tableHeaderRow}>
                <View style={el.tableNoteHeaderCell} />
                <Text style={[el.tableCell, el.tableCellSerie, el.tableHeaderText]}>
                  {t('coach.routine.seriesTable.seriesCol')}
                </Text>
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.seriesTable.col.reps')}</Text>
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.block.rpe')}</Text>
                {hasRom ? (
                  <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.warmupExerciseList.colRom')}</Text>
                ) : null}
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.block.weightKg')}</Text>
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.block.rest')}</Text>
                <Text style={[el.tableCell, el.tableHeaderText]}>{t('coach.routine.block.rir')}</Text>
              </View>
              {sets.map((s, rowIdx) => (
                <View key={`${s.setIndex}-${rowIdx}`} style={el.tableRow}>
                  <View style={el.tableNoteActionCell}>
                    <Pressable
                      accessibilityLabel={t('coach.routine.seriesNote.title', { n: rowIdx + 1 })}
                      onPress={() => onOpenSetNote(rowIdx)}
                      style={el.setNoteBtn}
                    >
                      <Text style={[el.setNoteIcon, s.note ? el.setNoteIconActive : null]}>{ICON_SET_NOTE}</Text>
                    </Pressable>
                  </View>
                  <Text style={[el.tableCell, el.tableCellSerie, el.tableCellValue]}>{s.setIndex + 1}</Text>
                  <Text style={[el.tableCell, el.tableCellValue]}>
                    {hasReps ? (s.reps != null ? String(s.reps) : ph) : ph}
                  </Text>
                  <Text style={[el.tableCell, el.tableCellValue]}>{hasRpe ? (s.rpe != null ? String(s.rpe) : ph) : ph}</Text>
                  {hasRom ? (
                    <Text style={[el.tableCell, el.tableCellValue]}>{s.rom != null && s.rom !== '' ? s.rom : ph}</Text>
                  ) : null}
                  <Text style={[el.tableCell, el.tableCellValue]}>
                    {hasWeight ? (s.weightKg != null ? String(s.weightKg) : ph) : ph}
                  </Text>
                  <Text style={[el.tableCell, el.tableCellValue]}>
                    {hasRest ? (s.restSeconds != null ? String(s.restSeconds) : ph) : ph}
                  </Text>
                  <Text style={[el.tableCell, el.tableCellValue]}>{hasRir ? (s.rir != null ? String(s.rir) : ph) : ph}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
