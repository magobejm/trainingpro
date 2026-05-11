import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { LogSetMutationInput, SessionItem, StrengthSessionItem } from '../../data/hooks/useTodaySession';

const KEYBOARD_NUMBER: KeyboardTypeOptions = 'number-pad';
const KEYBOARD_DECIMAL: KeyboardTypeOptions = 'decimal-pad';

type GridCellValue = {
  repsDone: string;
  weightDoneKg: string;
  effortRpe: string;
  effortRir: string;
};

type SetIndex = number;
type CellKey = `${string}-${SetIndex}-${'reps' | 'weight' | 'rpe' | 'rir'}`;

type TimerGridListProps = {
  items: SessionItem[];
  sessionId: string;
  onLogSet: (input: LogSetMutationInput) => void;
};

function initCells(item: StrengthSessionItem): Record<SetIndex, GridCellValue> {
  const sets = item.setsPlanned ?? 1;
  const record: Record<SetIndex, GridCellValue> = {};
  for (let i = 1; i <= sets; i++) {
    const log = item.logs.find((l) => l.setIndex === i);
    record[i] = {
      repsDone: log?.repsDone != null ? String(log.repsDone) : '',
      weightDoneKg: log?.weightDoneKg != null ? String(log.weightDoneKg) : '',
      effortRpe: log?.effortRpe != null ? String(log.effortRpe) : '',
      effortRir: log?.effortRir != null ? String(log.effortRir) : '',
    };
  }
  return record;
}

function useGridCardState(item: StrengthSessionItem, onLogSet: (input: LogSetMutationInput) => void) {
  const setsPlanned = item.setsPlanned ?? 1;
  const [cells, setCells] = useState<Record<SetIndex, GridCellValue>>(() => initCells(item));

  const updateCell = useCallback((setIndex: SetIndex, field: keyof GridCellValue, value: string) => {
    setCells((prev) => {
      const existing = prev[setIndex] ?? { repsDone: '', weightDoneKg: '', effortRpe: '', effortRir: '' };
      return { ...prev, [setIndex]: { ...existing, [field]: value } as GridCellValue };
    });
  }, []);

  const commitCell = useCallback(
    (setIndex: SetIndex) => {
      const cell = cells[setIndex];
      if (!cell) return;
      onLogSet({
        effortRir: cell.effortRir ? Number(cell.effortRir) : null,
        effortRpe: cell.effortRpe ? Number(cell.effortRpe) : null,
        repsDone: cell.repsDone ? Number(cell.repsDone) : null,
        sessionItemId: item.id,
        setIndex,
        weightDoneKg: cell.weightDoneKg ? Number(cell.weightDoneKg) : null,
      });
    },
    [cells, item.id, onLogSet],
  );

  const handleAutocomplete = useCallback(() => {
    const newCells: Record<SetIndex, GridCellValue> = {};
    for (let i = 1; i <= setsPlanned; i++) {
      newCells[i] = {
        repsDone: item.repsMax != null ? String(item.repsMax) : (cells[i]?.repsDone ?? ''),
        weightDoneKg: item.weightRangeMaxKg != null ? String(item.weightRangeMaxKg) : (cells[i]?.weightDoneKg ?? ''),
        effortRpe: item.targetRpe != null ? String(item.targetRpe) : (cells[i]?.effortRpe ?? ''),
        effortRir: item.targetRir != null ? String(item.targetRir) : (cells[i]?.effortRir ?? ''),
      };
    }
    setCells(newCells);
  }, [item, cells, setsPlanned]);

  const handleClear = useCallback(() => {
    const cleared: Record<SetIndex, GridCellValue> = {};
    for (let i = 1; i <= setsPlanned; i++) {
      cleared[i] = { repsDone: '', weightDoneKg: '', effortRpe: '', effortRir: '' };
    }
    setCells(cleared);
  }, [setsPlanned]);

  return { cells, updateCell, commitCell, handleAutocomplete, handleClear };
}

function GridTable({
  item,
  cells,
  updateCell,
  commitCell,
}: {
  item: StrengthSessionItem;
  cells: Record<SetIndex, GridCellValue>;
  updateCell: (idx: SetIndex, field: keyof GridCellValue, val: string) => void;
  commitCell: (idx: SetIndex) => void;
}) {
  const { t } = useTranslation();
  const setsPlanned = item.setsPlanned ?? 1;
  const setIndices = Array.from({ length: setsPlanned }, (_, i) => i + 1);
  const rows = [
    {
      field: 'reps' as const,
      label: t('client.timerGrid.reps'),
      keyboardType: KEYBOARD_NUMBER,
      cellKey: 'repsDone' as keyof GridCellValue,
    },
    {
      field: 'weight' as const,
      label: t('client.timerGrid.weight'),
      keyboardType: KEYBOARD_DECIMAL,
      cellKey: 'weightDoneKg' as keyof GridCellValue,
    },
    {
      field: 'rpe' as const,
      label: t('client.timerGrid.rpe'),
      keyboardType: KEYBOARD_NUMBER,
      cellKey: 'effortRpe' as keyof GridCellValue,
    },
    {
      field: 'rir' as const,
      label: t('client.timerGrid.rir'),
      keyboardType: KEYBOARD_NUMBER,
      cellKey: 'effortRir' as keyof GridCellValue,
    },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={gridStyles.tableRow}>
          <View style={gridStyles.rowHeaderCell} />
          {setIndices.map((i) => (
            <View key={i} style={gridStyles.setHeaderCell}>
              <Text style={gridStyles.setHeaderText}>{t('client.timerGrid.set', { index: i })}</Text>
            </View>
          ))}
        </View>
        {rows.map(({ field, label, keyboardType, cellKey }) => (
          <View key={field} style={gridStyles.tableRow}>
            <View style={gridStyles.rowHeaderCell}>
              <Text style={gridStyles.rowHeaderText}>{label}</Text>
            </View>
            {setIndices.map((setIdx) => {
              const uniqueKey: CellKey = `${item.id}-${setIdx}-${field}`;
              return (
                <View key={uniqueKey} style={gridStyles.dataCell}>
                  <TextInput
                    style={gridStyles.cellInput}
                    value={cells[setIdx]?.[cellKey] ?? ''}
                    onChangeText={(v) => updateCell(setIdx, cellKey, v)}
                    onBlur={() => commitCell(setIdx)}
                    keyboardType={keyboardType}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function StrengthGridCard({
  item,
  onLogSet,
}: {
  item: StrengthSessionItem;
  onLogSet: (input: LogSetMutationInput) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showTrainerVars, setShowTrainerVars] = useState(false);
  const { cells, updateCell, commitCell, handleAutocomplete, handleClear } = useGridCardState(item, onLogSet);

  return (
    <View style={gridStyles.card}>
      <Pressable style={gridStyles.header} onPress={() => setExpanded((v) => !v)}>
        <Text style={gridStyles.name} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={gridStyles.chevron}>{expanded ? '\u25BC' : '\u25B6'}</Text>
      </Pressable>

      {expanded && (
        <View style={gridStyles.tableContainer}>
          {showTrainerVars && item.restSeconds != null && (
            <Text style={gridStyles.restBanner}>{t('client.wizard.restRecommended', { seconds: item.restSeconds })}</Text>
          )}
          <View style={gridStyles.actionRow}>
            <Pressable
              style={[gridStyles.actionBtn, showTrainerVars && gridStyles.actionBtnActive]}
              onPress={() => setShowTrainerVars((v) => !v)}
            >
              <Text style={gridStyles.actionBtnText}>{t('client.wizard.trainerVars')}</Text>
            </Pressable>
            <Pressable style={gridStyles.actionBtn} onPress={handleAutocomplete}>
              <Text style={gridStyles.actionBtnText}>{t('client.wizard.autocomplete')}</Text>
            </Pressable>
            <Pressable style={[gridStyles.actionBtn, gridStyles.actionBtnSecondary]} onPress={handleClear}>
              <Text style={gridStyles.actionBtnTextSecondary}>{t('client.wizard.clear')}</Text>
            </Pressable>
          </View>
          <GridTable item={item} cells={cells} updateCell={updateCell} commitCell={commitCell} />
        </View>
      )}
    </View>
  );
}

export function TimerGridList({ items, onLogSet }: TimerGridListProps) {
  const strengthItems = items.filter((i): i is StrengthSessionItem => i.type === 'strength');

  return (
    <ScrollView style={listStyles.container} contentContainerStyle={listStyles.content}>
      {strengthItems.map((item) => (
        <StrengthGridCard key={item.id} item={item} onLogSet={onLogSet} />
      ))}
    </ScrollView>
  );
}

const gridStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  name: {
    color: '#e2e8f0',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {
    color: '#64748b',
    fontSize: 10,
    marginLeft: 8,
  },
  tableContainer: {
    borderTopColor: '#334155',
    borderTopWidth: 1,
    padding: 12,
  },
  restBanner: {
    backgroundColor: '#1d4ed8',
    borderRadius: 6,
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  actionBtn: {
    backgroundColor: '#334155',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 6,
  },
  actionBtnActive: {
    backgroundColor: '#6366f1',
  },
  actionBtnSecondary: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
  },
  actionBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBtnTextSecondary: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  rowHeaderCell: {
    justifyContent: 'center',
    paddingRight: 8,
    width: 56,
  },
  rowHeaderText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  setHeaderCell: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    width: 56,
  },
  setHeaderText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  dataCell: {
    marginRight: 4,
    width: 56,
  },
  cellInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 6,
    borderWidth: 1,
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 6,
    textAlign: 'center',
  },
});

const listStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
