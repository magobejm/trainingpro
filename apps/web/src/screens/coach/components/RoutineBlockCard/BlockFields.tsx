/* eslint-disable max-lines-per-function */
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { DraftBlock, DraftSet } from '../../RoutinePlanner.types';
import { s } from '../../RoutinePlanner.styles';
import { SeriesTable } from './SeriesTable';
import { AdvancedSeriesModal } from './AdvancedSeriesModal';
import { SeriesNoteModal } from './SeriesNoteModal';
import { copyPreviousSet } from '../../RoutinePlanner.helpers';
import { RoutineNumberField } from '../RoutineNumberField';

interface BlockFieldsProps {
  block: DraftBlock;
  readOnly: boolean;
  onUpdateField: (f: keyof DraftBlock, v: unknown) => void;
  t: (k: string) => string;
}

/** Returns the "planned count" field name for this block type */
function seriesFieldKey(type: DraftBlock['type']): keyof DraftBlock {
  if (type === 'strength' || type === 'isometric') return 'setsPlanned';
  return 'roundsPlanned';
}

export function BlockFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  const sets = block.sets ?? [];
  const lockedFields = block.lockedFields ?? [];
  const [advancedModalSeriesIdx, setAdvancedModalSeriesIdx] = useState<number | null>(null);
  const [noteModalSeriesIdx, setNoteModalSeriesIdx] = useState<number | null>(null);
  const [advancedEnabled, setAdvancedEnabled] = useState(false);

  const updateSets = (newSets: DraftSet[]) => onUpdateField('sets', newSets);

  const handleUpdateSet = (index: number, patch: Partial<DraftSet>) => {
    const next = sets.map((s2, i) => (i === index ? { ...s2, ...patch } : s2));
    updateSets(next);
  };

  const handleRemoveSet = (index: number) => {
    const next = sets.filter((_, i) => i !== index).map((s2, i) => ({ ...s2, setIndex: i }));
    updateSets(next);
    onUpdateField(seriesFieldKey(block.type), next.length);
  };

  /** Sync the sets array to a new target count (spinbox change) */
  const syncSetsToCount = (newCount: number) => {
    const count = Math.max(0, Math.min(30, newCount));
    let next = [...sets];
    if (count > next.length) {
      while (next.length < count) {
        next = [...next, { setIndex: next.length }];
      }
    } else {
      next = next.slice(0, count).map((s2, i) => ({ ...s2, setIndex: i }));
    }
    updateSets(next);
    onUpdateField(seriesFieldKey(block.type), count);
  };

  const handleCopyPrev = (index: number) => {
    const copied = copyPreviousSet(sets, index);
    handleUpdateSet(index, copied);
  };

  const handleToggleLock = (fieldKey: string) => {
    const next = lockedFields.includes(fieldKey) ? lockedFields.filter((k) => k !== fieldKey) : [...lockedFields, fieldKey];
    onUpdateField('lockedFields', next);
  };

  const handleApplyAdvanced = (technique: string) => {
    if (advancedModalSeriesIdx !== null) {
      handleUpdateSet(advancedModalSeriesIdx, { advancedTechnique: technique });
    }
  };

  const handleRemoveAdvanced = () => {
    if (advancedModalSeriesIdx !== null) {
      handleUpdateSet(advancedModalSeriesIdx, { advancedTechnique: undefined });
    }
  };

  const handleSaveNote = (note: string) => {
    if (noteModalSeriesIdx !== null) {
      handleUpdateSet(noteModalSeriesIdx, { note: note || undefined });
    }
  };

  const seriesCount = sets.length;

  return (
    <View style={bf.container}>
      {/* Global fields: Series spinbox + type-specific globals */}
      <View style={s.blockFields}>
        <SeriesSpinbox count={seriesCount} readOnly={readOnly} t={t} onChange={syncSetsToCount} />
        <GlobalFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />
      </View>

      {/* Per-series table header */}
      {seriesCount > 0 && (
        <View style={bf.tableHeader}>
          <Text style={bf.tableTitle}>{t('coach.routine.block.sets')}</Text>
          <View style={{ flex: 1 }} />
          {block.type === 'strength' && !readOnly && (
            <TouchableOpacity
              onPress={() => setAdvancedEnabled((v) => !v)}
              style={[bf.advancedBtn, advancedEnabled && bf.advancedBtnActive]}
            >
              <Text style={[bf.advancedBtnText, advancedEnabled && bf.advancedBtnTextActive]}>
                {advancedEnabled
                  ? `⚡ ${t('coach.routine.block.advancedOn')}`
                  : `⚡ ${t('coach.routine.block.advancedOff')}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {seriesCount > 0 && (
        <SeriesTable
          advancedEnabled={advancedEnabled}
          lockedFields={lockedFields}
          onCopyPrev={handleCopyPrev}
          onOpenAdvanced={(idx) => {
            setAdvancedModalSeriesIdx(idx);
          }}
          onOpenNote={(idx) => setNoteModalSeriesIdx(idx)}
          onRemoveAdvanced={(idx) => handleUpdateSet(idx, { advancedTechnique: undefined })}
          onRemoveSet={handleRemoveSet}
          onToggleLock={handleToggleLock}
          onUpdateSet={handleUpdateSet}
          readOnly={readOnly}
          sets={sets}
          t={t}
          type={block.type}
        />
      )}

      {/* Advanced series modal */}
      {advancedModalSeriesIdx !== null && (
        <AdvancedSeriesModal
          currentValue={sets[advancedModalSeriesIdx]?.advancedTechnique}
          onApply={handleApplyAdvanced}
          onClose={() => setAdvancedModalSeriesIdx(null)}
          onRemove={handleRemoveAdvanced}
          seriesIndex={advancedModalSeriesIdx}
          visible
        />
      )}

      {/* Series note modal */}
      {noteModalSeriesIdx !== null && (
        <SeriesNoteModal
          onClose={() => setNoteModalSeriesIdx(null)}
          onSave={handleSaveNote}
          seriesIndex={noteModalSeriesIdx}
          value={sets[noteModalSeriesIdx]?.note ?? ''}
          visible
        />
      )}
    </View>
  );
}

/** Spinbox for series count — increment/decrement buttons + numeric display */
const KB_NUMERIC = 'numeric' as const;
const SPIN_MINUS = '\u2212';
const SPIN_PLUS = '+';

function SeriesSpinbox({
  count,
  readOnly,
  t,
  onChange,
}: {
  count: number;
  readOnly: boolean;
  t: (k: string) => string;
  onChange: (n: number) => void;
}) {
  const [rawText, setRawText] = useState<string | null>(null);

  const handleBlur = () => {
    if (rawText !== null) {
      const parsed = parseInt(rawText, 10);
      onChange(Number.isFinite(parsed) ? parsed : count);
      setRawText(null);
    }
  };

  return (
    <View style={sp.wrap}>
      <Text style={sp.label}>{t('coach.routine.block.sets')}</Text>
      <View style={sp.controls}>
        {!readOnly && (
          <TouchableOpacity onPress={() => onChange(Math.max(0, count - 1))} style={sp.btn}>
            <Text style={sp.btnText}>{SPIN_MINUS}</Text>
          </TouchableOpacity>
        )}
        <TextInput
          editable={!readOnly}
          keyboardType={KB_NUMERIC}
          onBlur={handleBlur}
          onChangeText={setRawText}
          onSubmitEditing={handleBlur}
          style={sp.input}
          value={rawText !== null ? rawText : String(count)}
        />
        {!readOnly && (
          <TouchableOpacity onPress={() => onChange(count + 1)} style={sp.btn}>
            <Text style={sp.btnText}>{SPIN_PLUS}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/** Per-type global fields (everything except the Series spinbox) */
function GlobalFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  const x = txtField(block, onUpdateField, readOnly, t);
  if (block.type === 'strength') return <>{x('coach.routine.block.repsRange', 'repsRange')}</>;
  if (block.type === 'cardio')
    return <CardioGlobalFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />;
  if (block.type === 'plio') return <>{x('coach.routine.block.repsRange', 'repsRange')}</>;
  if (block.type === 'warmup') return <>{x('coach.routine.block.repsRange', 'repsRange')}</>;
  if (block.type === 'isometric') return null;
  if (block.type === 'sport')
    return <SportGlobalFields block={block} onUpdateField={onUpdateField} readOnly={readOnly} t={t} />;
  return (
    <RoutineNumberField
      label={t('coach.routine.block.duration')}
      onChange={(v) => onUpdateField('durationMinutes', v)}
      readOnly={readOnly}
      value={block.durationMinutes}
    />
  );
}

function CardioGlobalFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  const x = txtField(block, onUpdateField, readOnly, t);
  return (
    <>
      {x('coach.routine.block.workText', 'cardioWorkText')}
      <TextField
        label={t('coach.routine.block.totalTime')}
        onChange={(v) => {
          onUpdateField('totalTimeSeconds', v ? Number(v) : undefined);
        }}
        readOnly={readOnly}
        value={block.totalTimeSeconds !== undefined ? String(block.totalTimeSeconds) : ''}
        placeholder={t('coach.routine.block.totalTimePlaceholder')}
      />
    </>
  );
}

function SportGlobalFields({ block, readOnly, onUpdateField, t }: BlockFieldsProps) {
  const x = txtField(block, onUpdateField, readOnly, t);
  return (
    <>
      {x('coach.routine.block.repsRange', 'repsRange')}
      {x('coach.routine.block.workText', 'cardioWorkText')}
      <TextField
        label={t('coach.routine.block.totalTime')}
        onChange={(v) => {
          onUpdateField('totalTimeSeconds', v ? Number(v) : undefined);
        }}
        readOnly={readOnly}
        value={block.totalTimeSeconds !== undefined ? String(block.totalTimeSeconds) : ''}
        placeholder={t('coach.routine.block.totalTimePlaceholder')}
      />
    </>
  );
}

function txtField(
  block: DraftBlock,
  onUpdateField: (f: keyof DraftBlock, v: unknown) => void,
  readOnly: boolean,
  t: (k: string) => string,
) {
  return (labelKey: string, field: keyof DraftBlock) => (
    <TextField
      key={field as string}
      label={t(labelKey)}
      onChange={(v) => {
        if (field === 'repsRange' && !isValidRepsRangeInput(v)) return;
        onUpdateField(field, v);
      }}
      readOnly={readOnly}
      value={(block[field] as string | undefined) ?? ''}
    />
  );
}

function isValidRepsRangeInput(value: string): boolean {
  const raw = value.trim();
  if (!raw) return true;
  return /^\d+(\s*-\s*\d*)?$/.test(raw);
}

function TextField(props: {
  label: string;
  onChange: (v: string) => void;
  readOnly: boolean;
  value?: string;
  placeholder?: string;
}) {
  return (
    <View style={s.numberField}>
      <Text style={s.numberLabel}>{props.label}</Text>
      <TextInput
        editable={!props.readOnly}
        onChangeText={props.onChange}
        placeholder={props.placeholder ?? props.label}
        style={txtStyles.textInput}
        value={props.value ?? ''}
      />
    </View>
  );
}

const sp = {
  wrap: { gap: 4 },
  label: { fontSize: 11, fontWeight: '500' as const, color: '#64748b' },
  controls: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  btnText: { fontSize: 16, color: '#475569', lineHeight: 18 },
  input: {
    width: 36,
    textAlign: 'center' as const,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1e293b',
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
};

const bf = {
  container: { gap: 12 },
  tableHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 4,
  },
  tableTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  advancedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  advancedBtnActive: { backgroundColor: '#fef9c3', borderColor: '#fbbf24' },
  advancedBtnText: { fontSize: 11, fontWeight: '600' as const, color: '#64748b' },
  advancedBtnTextActive: { color: '#92400e' },
};

const txtStyles = {
  textInput: {
    ...s.numberInput,
    minWidth: 140,
    textAlign: 'left' as const,
  },
};
