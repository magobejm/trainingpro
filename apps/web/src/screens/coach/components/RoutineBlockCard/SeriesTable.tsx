import React from 'react';
import type { BaseSyntheticEvent } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { BlockType, DraftSet } from '../../RoutinePlanner.types';
import { setVariablesForType, type SetVariableKey } from '@trainerpro/shared';
import { advancedTechniqueDisplayLabel } from './advanced-technique.i18n';
import { ACTION_COL_W, SERIES_COL_W, st } from './SeriesTable.styles';
import { SeriesTableNumericCell } from './SeriesTableNumericCell';

interface ColDef {
  key: keyof DraftSet;
  label: string;
  width: number;
  numericOnly?: boolean;
  isSelect?: boolean;
  selectOptions?: string[];
}

const ICON_TRASH = '🗑';
const ICON_REMOVE = '✕';
const ICON_COPY = '⟳';
const ICON_LOCK_ON = '🔒';
const ICON_LOCK_OFF = '🔓';

const VARIABLE_WIDTH: Record<SetVariableKey, number> = {
  durationSeconds: 100,
  fcMaxPct: 90,
  fcReservePct: 100,
  heartRate: 100,
  reps: 100,
  restSeconds: 100,
  rir: 70,
  rom: 90,
  rpe: 70,
  weightKg: 90,
};

const VARIABLE_LABEL_KEY: Record<SetVariableKey, string> = {
  durationSeconds: 'coach.routine.seriesTable.col.durationSeconds',
  fcMaxPct: 'coach.routine.seriesTable.col.fcMaxPct',
  fcReservePct: 'coach.routine.seriesTable.col.fcReservePct',
  heartRate: 'coach.routine.block.heartRate',
  reps: 'coach.routine.seriesTable.col.reps',
  restSeconds: 'coach.routine.block.rest',
  rir: 'coach.routine.block.rir',
  rom: 'coach.routine.seriesTable.col.rom',
  rpe: 'coach.routine.block.rpe',
  weightKg: 'coach.routine.block.weightKg',
};

function colsForType(t: (k: string) => string, type: BlockType): ColDef[] {
  const romOptions = [
    t('coach.routine.seriesTable.rom.full'),
    t('coach.routine.seriesTable.rom.partial'),
    t('coach.routine.seriesTable.rom.minimal'),
  ];
  return setVariablesForType(type).map((key) => {
    if (key === 'rom') {
      return {
        key: 'rom',
        label: t('coach.routine.seriesTable.col.rom'),
        width: VARIABLE_WIDTH.rom,
        isSelect: true,
        selectOptions: romOptions,
      };
    }
    return { key, label: t(VARIABLE_LABEL_KEY[key]), width: VARIABLE_WIDTH[key] };
  });
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
  onOpenAdvanced,
  onRemoveAdvanced,
  onToggleLock,
  t,
}: SeriesTableProps) {
  const allCols = colsForType(t, type);
  const orderedCols = allCols;
  const tableWidth = ACTION_COL_W + SERIES_COL_W + orderedCols.reduce((sum, c) => sum + c.width + 8, 0);
  const phDash = t('coach.routine.seriesTable.placeholderDash');

  return (
    <ScrollView horizontal style={{ marginTop: 8 }}>
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
      <SeriesRowActions idx={idx} onCopyPrev={onCopyPrev} onRemoveSet={onRemoveSet} readOnly={readOnly} />
      <SeriesRowNumberCell
        advancedEnabled={advancedEnabled}
        idx={idx}
        onOpenAdvanced={onOpenAdvanced}
        onRemoveAdvanced={onRemoveAdvanced}
        readOnly={readOnly}
        set={set}
        t={t}
      />
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

function SeriesRowActions({
  idx,
  readOnly,
  onCopyPrev,
  onRemoveSet,
}: {
  idx: number;
  readOnly: boolean;
  onCopyPrev: (i: number) => void;
  onRemoveSet: (i: number) => void;
}) {
  return (
    <View style={[st.actionCell, { width: ACTION_COL_W }]}>
      {!readOnly && idx > 0 ? (
        <TouchableOpacity onPress={() => onCopyPrev(idx)} style={st.actionBtn}>
          <Text style={st.copyIcon}>{ICON_COPY}</Text>
        </TouchableOpacity>
      ) : null}
      {!readOnly && (
        <TouchableOpacity onPress={() => onRemoveSet(idx)} style={st.actionBtn}>
          <Text style={st.actionIconRemove}>{ICON_TRASH}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SeriesRowNumberCell({
  set,
  idx,
  readOnly,
  advancedEnabled,
  onOpenAdvanced,
  onRemoveAdvanced,
  t,
}: {
  set: DraftSet;
  idx: number;
  readOnly: boolean;
  advancedEnabled: boolean;
  onOpenAdvanced: (i: number) => void;
  onRemoveAdvanced: (i: number) => void;
  t: (k: string) => string;
}) {
  const showAdvancedLabel = Boolean(set.advancedTechnique);
  const isSeriesClickable = (advancedEnabled && !readOnly) || (readOnly && showAdvancedLabel);

  return (
    <View style={[st.seriesCell, { width: SERIES_COL_W }]}>
      {isSeriesClickable ? (
        <TouchableOpacity style={st.seriesCellClickable} onPress={() => onOpenAdvanced(idx)}>
          <View style={[st.seriesNumberBtn, set.advancedTechnique ? st.seriesNumberBtnActive : null]}>
            <Text style={[st.seriesNumberBtnText, set.advancedTechnique ? st.seriesNumberBtnTextActive : null]}>
              {idx + 1}
            </Text>
          </View>
          {showAdvancedLabel ? (
            <View style={st.advancedLabelRow}>
              <Text style={st.advancedLabel} numberOfLines={1}>
                {advancedTechniqueDisplayLabel(set.advancedTechnique!, t)}
              </Text>
              {advancedEnabled && !readOnly ? (
                <TouchableOpacity
                  onPress={(e) => {
                    (e as BaseSyntheticEvent).stopPropagation?.();
                    onRemoveAdvanced(idx);
                  }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={st.advancedRemoveIcon}>{ICON_REMOVE}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </TouchableOpacity>
      ) : (
        <>
          <Text style={st.seriesNumber}>{idx + 1}</Text>
          {showAdvancedLabel ? (
            <View style={st.advancedLabelRow}>
              <Text style={st.advancedLabel} numberOfLines={1}>
                {advancedTechniqueDisplayLabel(set.advancedTechnique!, t)}
              </Text>
            </View>
          ) : null}
        </>
      )}
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
              <SeriesTableNumericCell
                fieldKey={col.key}
                onChange={(v) => onUpdateSet(idx, { [col.key]: v } as Partial<DraftSet>)}
                placeholder={phDash}
                readOnly={readOnly}
                value={set[col.key] as number | undefined}
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
