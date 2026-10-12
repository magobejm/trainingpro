import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';
import { WarmupExerciseList } from './WarmupExerciseList';
import { matchesSearch } from '../../../../utils/normalize-search';
import { Button, EmptyState, Modal, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  onCancel: () => void;
  onSelect: (template: WarmupTemplateView) => void;
  templates: WarmupTemplateView[];
  t: (key: string, options?: { count: number }) => string;
  visible: boolean;
};

export function WarmupTemplatePickerModal(props: Props): React.JSX.Element {
  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={<Button label={props.t('common.cancel')} onPress={props.onCancel} variant="secondary" />}
      onClose={props.onCancel}
      size="lg"
      title={props.t('coach.routine.warmupTemplatePicker.title')}
      visible={props.visible}
    >
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
    <View style={styles.sheet}>
      <TextField
        accessibilityLabel={props.t('coach.routine.warmupTemplatePicker.searchPlaceholder')}
        onChangeText={setQuery}
        placeholder={props.t('coach.routine.warmupTemplatePicker.searchPlaceholder')}
        value={query}
      />
      {sortedFiltered.length === 0 ? (
        <EmptyState title={props.t('coach.routine.warmupTemplatePicker.noMatches')} />
      ) : (
        sortedFiltered.map((template) => (
          <TemplateRow key={template.id} onSelect={props.onSelect} t={props.t} template={template} />
        ))
      )}
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
          <Button label={props.t('coach.routine.warmup.select')} onPress={() => props.onSelect(props.template)} size="sm" />
        </View>
      </View>
      {expanded && <WarmupExerciseList items={props.template.items} groups={props.template.groups} />}
    </View>
  );
}

const styles = {
  sheet: {
    gap: space.md,
  },
  item: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
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
};
