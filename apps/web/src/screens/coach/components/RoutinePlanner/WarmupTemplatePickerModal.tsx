import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';
import { s } from '../../RoutinePlanner.styles';

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
    <Modal
      animationType={MODAL_ANIMATION}
      onRequestClose={props.onCancel}
      transparent
      visible={props.visible}
    >
      <PickerSheet {...props} />
    </Modal>
  );
}

function PickerSheet(props: Props): React.JSX.Element {
  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <Text style={styles.title}>{props.t('coach.routine.warmupTemplatePicker.title')}</Text>
        <ScrollView style={styles.list}>
          {props.templates.map((template) => (
            <TemplateRow
              key={template.id}
              onSelect={props.onSelect}
              t={props.t}
              template={template}
            />
          ))}
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
  return (
    <Pressable onPress={() => props.onSelect(props.template)} style={styles.item}>
      <Text style={styles.itemName}>{props.template.name}</Text>
      <Text style={styles.itemMeta}>
        {props.t('coach.warmupPlanner.blocksCount', { count: props.template.items.length })}
      </Text>
    </Pressable>
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
    maxHeight: 560,
    maxWidth: 560,
    padding: 16,
    width: '100%' as const,
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  list: {
    maxHeight: 420,
  },
  item: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    padding: 12,
  },
  itemName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  itemMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
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
