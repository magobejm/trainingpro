import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PhysicalTestView } from '../../data/hooks/usePhysicalTests';
import { Button, EmptyState, Modal, colors, fontSize, radius, space } from '@trainerpro/ui';

const MODAL_SIZE = 'lg' as const;
const VARIANT_SECONDARY = 'secondary' as const;

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
    <Modal
      closeLabel={props.t('common.close')}
      footer={<Button label={props.t('common.close')} onPress={props.onClose} variant={VARIANT_SECONDARY} />}
      onClose={props.onClose}
      size={MODAL_SIZE}
      title={props.t('coach.tests.tables.title')}
      visible={props.visible}
    >
      {props.test ? <Text style={styles.subtitle}>{props.test.name}</Text> : null}
      <View style={styles.content}>
        {tables.length > 0 ? (
          tables.map((table, index) => renderTable(table, index))
        ) : (
          <EmptyState title={props.t('coach.tests.tables.fallback')} />
        )}
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
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: space.sm,
  },
  content: {
    gap: space.lg,
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
});
