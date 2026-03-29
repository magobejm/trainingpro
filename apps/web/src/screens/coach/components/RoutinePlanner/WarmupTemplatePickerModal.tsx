import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';
import { s } from '../../RoutinePlanner.styles';
import { WarmupExerciseList } from './WarmupExerciseList';

type Props = {
  onCancel: () => void;
  onSelect: (template: WarmupTemplateView) => void;
  templates: WarmupTemplateView[];
  t: (key: string, options?: { count: number }) => string;
  visible: boolean;
};

const MODAL_ANIMATION = 'fade' as const;

export function WarmupTemplatePickerModal(props: Props): React.JSX.Element {
  return (
    <Modal animationType={MODAL_ANIMATION} onRequestClose={props.onCancel} transparent visible={props.visible}>
      <PickerSheet {...props} />
    </Modal>
  );
}

function PickerSheet(props: Props): React.JSX.Element {
  const { i18n } = useTranslation();
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (props.visible) setQuery('');
  }, [props.visible]);

  const sortedFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...props.templates];
    list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', i18n.language || 'en', { sensitivity: 'base' }));
    if (!q) return list;
    return list.filter((t) => (t.name ?? '').toLowerCase().includes(q));
  }, [props.templates, query, i18n.language]);

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <Text style={styles.title}>{props.t('coach.routine.warmupTemplatePicker.title')}</Text>
        <TextInput
          accessibilityLabel={props.t('coach.routine.warmupTemplatePicker.searchPlaceholder')}
          onChangeText={setQuery}
          placeholder={props.t('coach.routine.warmupTemplatePicker.searchPlaceholder')}
          style={styles.searchInput}
          value={query}
        />
        <ScrollView style={styles.list}>
          {sortedFiltered.length === 0 ? (
            <Text style={styles.emptyList}>{props.t('coach.routine.warmupTemplatePicker.noMatches')}</Text>
          ) : (
            sortedFiltered.map((template) => (
              <TemplateRow key={template.id} onSelect={props.onSelect} t={props.t} template={template} />
            ))
          )}
        </ScrollView>
        <Pressable onPress={props.onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>{props.t('common.cancel')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TemplateRow(props: {
  onSelect: (template: WarmupTemplateView) => void;
  t: (key: string, options?: { count: number }) => string;
  template: WarmupTemplateView;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.itemLabelArea}>
          <Text style={styles.itemName}>{props.template.name}</Text>
          <Text style={styles.itemMeta}>
            {props.t('coach.warmupPlanner.blocksCount', { count: props.template.items.length })}
          </Text>
        </Pressable>
        <View style={styles.itemActions}>
          <Pressable onPress={() => setExpanded((v) => !v)} style={styles.expandBtn}>
            <Text style={styles.expandBtnText}>{expanded ? '▲' : '▼'}</Text>
          </Pressable>
          <Pressable onPress={() => props.onSelect(props.template)} style={styles.selectBtn}>
            <Text style={styles.selectBtnText}>{props.t('coach.routine.warmup.select')}</Text>
          </Pressable>
        </View>
      </View>
      {expanded && <WarmupExerciseList items={props.template.items} groups={props.template.groups} />}
    </View>
  );
}

const styles = {
  overlay: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center' as const,
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 14,
    maxHeight: '90vh' as unknown as number,
    maxWidth: 680,
    padding: 16,
    width: '100%' as const,
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    color: '#0f172a',
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  list: {
    maxHeight: '80vh' as unknown as number,
  },
  emptyList: {
    color: '#64748b',
    fontSize: 14,
    paddingVertical: 16,
    textAlign: 'center' as const,
  },
  item: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  itemHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    gap: 8,
  },
  itemLabelArea: {
    flex: 1,
  },
  itemName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  itemMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  expandBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  expandBtnText: { fontSize: 10, color: '#475569' },
  selectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  selectBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  cancelBtn: {
    ...s.deleteBtn,
    alignSelf: 'flex-end' as const,
    marginTop: 8,
  },
  cancelText: {
    ...s.deleteBtnText,
  },
};
