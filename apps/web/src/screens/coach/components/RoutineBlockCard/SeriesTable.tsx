import React from 'react';
import type { BaseSyntheticEvent } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { BlockType, DraftSet } from '../../RoutinePlanner.types';
import { advancedTechniqueDisplayLabel } from './advanced-technique.i18n';

interface ColDef {
  key: keyof DraftSet;
  label: string;
  width: number;
  numericOnly?: boolean;
  isSelect?: boolean;
  selectOptions?: string[];
}

const KB_NUMERIC = 'numeric' as const;
const ACTION_COL_W = 56;
const SERIES_COL_W = 48;
const PLACEHOLDER_MUTED = '#cbd5e1';
const ICON_NOTE = '📝';
const ICON_TRASH = '🗑';
const ICON_REMOVE = '✕';
const ICON_COPY = '⟳';
const ICON_LOCK_ON = '🔒';
const ICON_LOCK_OFF = '🔓';

function colsForType(t: (k: string) => string, type: BlockType): ColDef[] {
  switch (type) {
    case 'cardio':
      return [
        { key: 'fcMaxPct', label: t('coach.routine.seriesTable.col.fcMaxPct'), width: 90 },
        { key: 'fcReservePct', label: t('coach.routine.seriesTable.col.fcReservePct'), width: 100 },
        { key: 'heartRate', label: t('coach.routine.block.heartRate'), width: 100 },
        { key: 'rpe', label: t('coach.routine.block.rpe'), width: 70 },
      ];
    case 'plio':
      return [
        { key: 'reps', label: t('coach.routine.seriesTable.col.reps'), width: 100 },
        { key: 'rpe', label: t('coach.routine.block.rpe'), width: 70 },
        { key: 'weightKg', label: t('coach.routine.block.weightKg'), width: 90 },
        { key: 'restSeconds', label: t('coach.routine.block.rest'), width: 100 },
      ];
    case 'isometric':
      return [
        { key: 'rpe', label: t('coach.routine.block.rpe'), width: 70 },
        { key: 'durationSeconds', label: t('coach.routine.seriesTable.col.durationSeconds'), width: 100 },
        { key: 'weightKg', label: t('coach.routine.block.weightKg'), width: 90 },
        { key: 'restSeconds', label: t('coach.routine.block.rest'), width: 100 },
      ];
    case 'mobility':
      return [
        { key: 'reps', label: t('coach.routine.seriesTable.col.reps'), width: 100 },
        { key: 'rpe', label: t('coach.routine.block.rpe'), width: 70 },
        {
          key: 'rom',
          label: 'ROM',
          width: 90,
          isSelect: true,
          selectOptions: [
            t('coach.routine.seriesTable.rom.full'),
            t('coach.routine.seriesTable.rom.partial'),
            t('coach.routine.seriesTable.rom.minimal'),
          ],
        },
        { key: 'restSeconds', label: t('coach.routine.block.rest'), width: 100 },
      ];
    case 'sport':
      return [
        { key: 'reps', label: t('coach.routine.seriesTable.col.reps'), width: 100 },
        { key: 'rpe', label: t('coach.routine.block.rpe'), width: 70 },
        { key: 'rir', label: t('coach.routine.block.rir'), width: 70 },
        { key: 'weightKg', label: t('coach.routine.block.weightKg'), width: 90 },
        { key: 'fcMaxPct', label: t('coach.routine.seriesTable.col.fcMaxPct'), width: 90 },
        { key: 'fcReservePct', label: t('coach.routine.seriesTable.col.fcReservePct'), width: 100 },
        { key: 'heartRate', label: t('coach.routine.block.heartRate'), width: 100 },
        { key: 'restSeconds', label: t('coach.routine.block.rest'), width: 100 },
      ];
    default:
      return [
        { key: 'reps', label: t('coach.routine.seriesTable.col.reps'), width: 100 },
        { key: 'rpe', label: t('coach.routine.block.rpe'), width: 70 },
        { key: 'weightKg', label: t('coach.routine.block.weightKg'), width: 90 },
        { key: 'rir', label: t('coach.routine.block.rir'), width: 70 },
        { key: 'restSeconds', label: t('coach.routine.block.rest'), width: 100 },
      ];
  }
}

interface SeriesTableProps {
  type: BlockType;
  sets: DraftSet[];
  lockedFields?: string[];
  advancedEnabled?: boolean;
  readOnly?: boolean;
  onUpdateSet: (index: number, patch: Partial<DraftSet>) => void;
  onRemoveSet: (index: number) => void;
  onCopyPrev: (index: number) => void;
  onOpenNote: (index: number) => void;
  onOpenAdvanced: (index: number) => void;
  onRemoveAdvanced: (index: number) => void;
  onToggleLock: (fieldKey: string) => void;
  t: (k: string) => string;
}

export function SeriesTable({
  type,
  sets,
  lockedFields = [],
  advancedEnabled = false,
  readOnly = false,
  onUpdateSet,
  onRemoveSet,
  onCopyPrev,
  onOpenNote,
  onOpenAdvanced,
  onRemoveAdvanced,
  onToggleLock,
  t,
}: SeriesTableProps) {
  const allCols = colsForType(t, type);
  const activeCols = allCols.filter((c) => !lockedFields.includes(c.key as string));
  const lockedCols = allCols.filter((c) => lockedFields.includes(c.key as string));
  const orderedCols = [...activeCols, ...lockedCols];
  const tableWidth = ACTION_COL_W + SERIES_COL_W + orderedCols.reduce((sum, c) => sum + c.width + 8, 0);
  const phDash = t('coach.routine.seriesTable.placeholderDash');

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
      <View style={{ minWidth: tableWidth }}>
        <SeriesHeaderRow
          lockedFields={lockedFields}
          onToggleLock={onToggleLock}
          orderedCols={orderedCols}
          readOnly={readOnly}
          t={t}
        />
        {sets.map((set, idx) => (
          <SeriesDataRow
            key={idx}
            advancedEnabled={advancedEnabled}
            idx={idx}
            lockedFields={lockedFields}
            onCopyPrev={onCopyPrev}
            onOpenAdvanced={onOpenAdvanced}
            onOpenNote={onOpenNote}
            onRemoveAdvanced={onRemoveAdvanced}
            onRemoveSet={onRemoveSet}
            onUpdateSet={onUpdateSet}
            orderedCols={orderedCols}
            phDash={phDash}
            readOnly={readOnly}
            set={set}
            t={t}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function SeriesHeaderRow({
  orderedCols,
  lockedFields,
  readOnly,
  onToggleLock,
  t,
}: {
  orderedCols: ColDef[];
  lockedFields: string[];
  readOnly: boolean;
  onToggleLock: (k: string) => void;
  t: (k: string) => string;
}) {
  return (
    <View style={[st.row, st.headerRow]}>
      <View style={{ width: ACTION_COL_W }} />
      <View style={[st.headerCell, { width: SERIES_COL_W }]}>
        <Text style={st.headerText}>{t('coach.routine.seriesTable.seriesCol')}</Text>
      </View>
      {orderedCols.map((col) => {
        const isLocked = lockedFields.includes(col.key as string);
        return (
          <View key={col.key as string} style={[st.headerCell, { width: col.width + 8 }]}>
            <Text style={[st.headerText, isLocked && st.headerTextLocked]} numberOfLines={1}>
              {col.label}
            </Text>
            {!readOnly && (
              <TouchableOpacity onPress={() => onToggleLock(col.key as string)} style={st.lockBtn}>
                <Text style={[st.lockIcon, isLocked && st.lockIconActive]}>{isLocked ? ICON_LOCK_ON : ICON_LOCK_OFF}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

function SeriesDataRow({
  set,
  idx,
  orderedCols,
  lockedFields,
  readOnly,
  advancedEnabled,
  onOpenNote,
  onRemoveSet,
  onOpenAdvanced,
  onRemoveAdvanced,
  onCopyPrev,
  onUpdateSet,
  phDash,
  t,
}: {
  set: DraftSet;
  idx: number;
  orderedCols: ColDef[];
  lockedFields: string[];
  readOnly: boolean;
  advancedEnabled: boolean;
  onOpenNote: (i: number) => void;
  onRemoveSet: (i: number) => void;
  onOpenAdvanced: (i: number) => void;
  onRemoveAdvanced: (i: number) => void;
  onCopyPrev: (i: number) => void;
  onUpdateSet: (i: number, p: Partial<DraftSet>) => void;
  phDash: string;
  t: (k: string) => string;
}) {
  return (
    <View style={[st.row, idx % 2 === 0 ? st.rowEven : st.rowOdd]}>
      <View style={[st.actionCell, { width: ACTION_COL_W }]}>
        <TouchableOpacity onPress={() => onOpenNote(idx)} style={st.actionBtn}>
          <Text style={[st.actionIcon, !!set.note && st.actionIconActive]}>{ICON_NOTE}</Text>
        </TouchableOpacity>
        {!readOnly && (
          <TouchableOpacity onPress={() => onRemoveSet(idx)} style={st.actionBtn}>
            <Text style={st.actionIconRemove}>{ICON_TRASH}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[st.seriesCell, { width: SERIES_COL_W }, advancedEnabled && !readOnly && st.seriesCellClickable]}
        onPress={() => advancedEnabled && !readOnly && onOpenAdvanced(idx)}
      >
        <Text style={[st.seriesNumber, advancedEnabled && !readOnly && st.seriesNumberAdvanced]}>{idx + 1}</Text>
        {set.advancedTechnique ? (
          <View style={st.advancedLabelRow}>
            <Text style={st.advancedLabel} numberOfLines={1}>
              {advancedTechniqueDisplayLabel(set.advancedTechnique, t)}
            </Text>
            {!readOnly && (
              <TouchableOpacity
                onPress={(e) => {
                  (e as BaseSyntheticEvent).stopPropagation?.();
                  onRemoveAdvanced(idx);
                }}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={st.advancedRemoveIcon}>{ICON_REMOVE}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
        {idx > 0 && !readOnly && (
          <TouchableOpacity onPress={() => onCopyPrev(idx)} style={st.copyBtn}>
            <Text style={st.copyIcon}>{ICON_COPY}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <SeriesRowValueCells
        idx={idx}
        lockedFields={lockedFields}
        onUpdateSet={onUpdateSet}
        orderedCols={orderedCols}
        phDash={phDash}
        readOnly={readOnly}
        set={set}
        t={t}
      />
    </View>
  );
}

function SeriesRowValueCells({
  set,
  idx,
  orderedCols,
  lockedFields,
  readOnly,
  onUpdateSet,
  phDash,
  t,
}: {
  set: DraftSet;
  idx: number;
  orderedCols: ColDef[];
  lockedFields: string[];
  readOnly: boolean;
  onUpdateSet: (i: number, p: Partial<DraftSet>) => void;
  phDash: string;
  t: (k: string) => string;
}) {
  return (
    <>
      {orderedCols.map((col) => {
        const isLocked = lockedFields.includes(col.key as string);
        return (
          <View key={col.key as string} style={[st.dataCell, { width: col.width + 8 }, isLocked && st.dataCellLocked]}>
            {isLocked ? null : col.isSelect ? (
              <SelectCell
                options={col.selectOptions ?? []}
                readOnly={readOnly}
                selectPlaceholder={t('coach.routine.seriesTable.selectPlaceholder')}
                value={(set[col.key] as string) ?? ''}
                onChange={(v) => onUpdateSet(idx, { [col.key]: v } as Partial<DraftSet>)}
              />
            ) : (
              <TextInput
                editable={!readOnly}
                keyboardType={KB_NUMERIC}
                onChangeText={(v) => {
                  const num = v === '' ? undefined : Number(v);
                  onUpdateSet(idx, { [col.key]: Number.isFinite(num) ? num : undefined } as Partial<DraftSet>);
                }}
                placeholder={phDash}
                placeholderTextColor={PLACEHOLDER_MUTED}
                style={[st.cellInput, readOnly && st.cellInputReadOnly]}
                value={set[col.key] !== undefined && set[col.key] !== null ? String(set[col.key]) : ''}
              />
            )}
          </View>
        );
      })}
    </>
  );
}

function SelectCell({
  options,
  value,
  onChange,
  readOnly,
  selectPlaceholder,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  selectPlaceholder: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (React.createElement as any)(
    'select',
    {
      value: value || '',
      disabled: readOnly,
      onChange: (e: { target: { value: string } }) => {
        if (!readOnly) onChange(e.target.value);
      },
      style: {
        fontSize: 12,
        padding: '5px 4px',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        backgroundColor: readOnly ? '#f8fafc' : '#fff',
        color: value ? '#1e293b' : '#94a3b8',
        width: '100%',
        cursor: readOnly ? 'default' : 'pointer',
        outline: 'none',
        appearance: 'auto',
      },
    },
    React.createElement('option', { value: '' }, selectPlaceholder),
    ...options.map((opt) => React.createElement('option', { key: opt, value: opt }, opt)),
  );
}

const st = {
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderBottomWidth: 0,
    paddingVertical: 6,
  },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#fafafa' },
  headerCell: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  headerTextLocked: { color: '#cbd5e1' },
  lockBtn: { padding: 2 },
  lockIcon: { fontSize: 11, color: '#94a3b8' },
  lockIconActive: { color: '#ef4444' },
  actionCell: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    paddingVertical: 6,
  },
  actionBtn: { padding: 4 },
  actionIcon: { fontSize: 14, color: '#cbd5e1' },
  actionIconActive: { color: '#3b82f6' },
  actionIconRemove: { fontSize: 12, color: '#f87171' },
  seriesCell: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 6,
    gap: 2,
  },
  seriesCellClickable: { cursor: 'pointer' } as { cursor: 'pointer' },
  seriesNumber: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#475569',
  },
  seriesNumberAdvanced: { color: '#ef4444' },
  advancedLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
    width: SERIES_COL_W - 4,
    overflow: 'hidden' as const,
  },
  advancedLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#374151',
    flexShrink: 1,
  },
  advancedRemoveIcon: {
    fontSize: 9,
    color: '#ef4444',
    fontWeight: '700' as const,
    lineHeight: 12,
  },
  copyBtn: { marginTop: 2 },
  copyIcon: { fontSize: 12, color: '#3b82f6' },
  dataCell: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  dataCellLocked: { backgroundColor: '#f8fafc' },
  cellInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1e293b',
    textAlign: 'center' as const,
    backgroundColor: '#fff',
  },
  cellInputReadOnly: { backgroundColor: '#f8fafc', color: '#64748b' },
  selectTrigger: { paddingHorizontal: 6 },
  selectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  selectSheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectOptionActive: { backgroundColor: '#eff6ff' },
  selectCancelOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center' as const,
  },
  selectCancelText: { fontSize: 13, color: '#94a3b8' },
  selectOptionText: { fontSize: 14, color: '#475569', textAlign: 'center' as const },
  selectOptionTextActive: { color: '#3b82f6', fontWeight: '700' as const },
};
