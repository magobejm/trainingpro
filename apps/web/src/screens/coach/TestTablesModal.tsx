import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PhysicalTestView } from '../../data/hooks/usePhysicalTests';

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
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '85%',
    maxWidth: 720,
    padding: 20,
    width: '100%',
  },
  title: {
    color: '#0e1a2f',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#627285',
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    gap: 16,
    paddingVertical: 16,
  },
  fallback: {
    color: '#627285',
    fontSize: 14,
    lineHeight: 20,
  },
  tableBlock: {
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableTitle: {
    backgroundColor: '#f8fafc',
    color: '#0e1a2f',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerRow: {
    backgroundColor: '#edf3fb',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
  },
  headerCell: {
    color: '#0e1a2f',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 80,
  },
  dataRow: {
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
  },
  dataCell: {
    color: '#334155',
    flex: 1,
    fontSize: 12,
    minWidth: 80,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#225fdb',
    borderRadius: 10,
    paddingVertical: 12,
  },
  closeLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
