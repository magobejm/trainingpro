import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';
import { s } from '../../RoutinePlanner.styles';
import { WarmupExerciseList } from './WarmupExerciseList';
import { matchesSearch } from '../../../../utils/normalize-search';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

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
    const list = [...props.templates];
    list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', i18n.language || 'en', { sensitivity: 'base' }));
    return list.filter((t) => matchesSearch(t.name ?? '', query));
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
    padding: space.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '90vh' as unknown as number,
    maxWidth: 680,
    padding: space.lg,
    width: '100%' as const,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700' as const,
    marginBottom: space.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: fontSize.sm,
    marginBottom: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  list: {
    maxHeight: '80vh' as unknown as number,
  },
  emptyList: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingVertical: space.lg,
    textAlign: 'center' as const,
  },
  item: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: space.sm,
    overflow: 'hidden' as const,
  },
  itemHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: space.md,
    gap: space.sm,
  },
  itemLabelArea: {
    flex: 1,
  },
  itemName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600' as const,
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: space.sm,
  },
  expandBtn: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  expandBtnText: { fontSize: fontSize.xs, color: colors.textMuted },
  selectBtn: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  selectBtnText: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '600' as const,
  },
  cancelBtn: {
    ...s.deleteBtn,
    alignSelf: 'flex-end' as const,
    marginTop: space.sm,
  },
  cancelText: {
    ...s.deleteBtnText,
  },
};
