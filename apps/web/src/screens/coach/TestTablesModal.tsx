import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PhysicalTestView } from '../../data/hooks/usePhysicalTests';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_ANIMATION_FADE = 'fade' as const;

type Props = {
  onClose: () => void;
  t: (key: string) => string;
  test: PhysicalTestView | null;
  visible: boolean;
};

type NormTableRow = {
  label?: string;
  values?: Array<string | number>;
  range?: string;
  classification?: string;
};

type NormTable = {
  title?: string;
  headers?: string[];
  rows?: NormTableRow[];
};

export function TestTablesModal(props: Props): React.JSX.Element {
  const tables = parseNormTables(props.test?.normTables);
  return (
    <Modal animationType={MODAL_ANIMATION_FADE} onRequestClose={props.onClose} transparent visible={props.visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{props.t('coach.tests.tables.title')}</Text>
          {props.test ? <Text style={styles.subtitle}>{props.test.name}</Text> : null}
          <ScrollView contentContainerStyle={styles.content}>
            {tables.length > 0 ? (
              tables.map((table, index) => renderTable(table, index))
            ) : (
              <Text style={styles.fallback}>{props.t('coach.tests.tables.fallback')}</Text>
            )}
          </ScrollView>
          <Pressable onPress={props.onClose} style={styles.closeButton}>
            <Text style={styles.closeLabel}>{props.t('common.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function parseNormTables(value: unknown): NormTable[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(isNormTable);
  }
  if (isNormTable(value)) return [value];
  return [];
}

function isNormTable(value: unknown): value is NormTable {
  return typeof value === 'object' && value !== null;
}

function renderTable(table: NormTable, index: number): React.JSX.Element {
  const headers = table.headers ?? [];
  const rows = table.rows ?? [];
  return (
    <View key={`table-${index}`} style={styles.tableBlock}>
      {table.title ? <Text style={styles.tableTitle}>{table.title}</Text> : null}
      {headers.length > 0 ? (
        <View style={styles.headerRow}>
          {headers.map((header) => (
            <Text key={header} style={styles.headerCell}>
              {header}
            </Text>
          ))}
        </View>
      ) : null}
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.dataRow}>
          {row.label ? <Text style={styles.dataCell}>{row.label}</Text> : null}
          {row.range ? <Text style={styles.dataCell}>{row.range}</Text> : null}
          {row.classification ? <Text style={styles.dataCell}>{row.classification}</Text> : null}
          {row.values?.map((value, valueIndex) => (
            <Text key={`value-${valueIndex}`} style={styles.dataCell}>
              {String(value)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    maxHeight: '85%',
    maxWidth: 720,
    padding: space.xl,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: space.xs,
  },
  content: {
    gap: space.lg,
    paddingVertical: space.lg,
  },
  fallback: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  tableBlock: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableTitle: {
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  headerRow: {
    backgroundColor: colors.background,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    padding: space.md,
  },
  headerCell: {
    color: colors.text,
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: '700',
    minWidth: 80,
  },
  dataRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    padding: space.md,
  },
  dataCell: {
    color: colors.text,
    flex: 1,
    fontSize: fontSize.xs,
    minWidth: 80,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.md,
  },
  closeLabel: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
