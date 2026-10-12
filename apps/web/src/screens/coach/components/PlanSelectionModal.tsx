import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRoutineTemplatesQuery } from '../../../data/hooks/useRoutineTemplates';
import { usePlanTemplatesQuery } from '../../../data/hooks/usePlanTemplates';
import { matchesSearch } from '../../../utils/normalize-search';
import { Button, EmptyState, Modal, TextField, colors, fontSize, space } from '@trainerpro/ui';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (planId: string) => void;
  t: (key: string) => string;
};

export function PlanSelectionModal(props: Props): React.JSX.Element {
  const { routines, strength, isLoading } = usePlanData();
  const [search, setSearch] = useState('');
  const allTemplates = [...routines, ...strength];
  const filtered = allTemplates.filter((tpl) => matchesSearch(tpl.name, search));

  return (
    <Modal
      closeLabel={props.t('common.close')}
      footer={<Button label={props.t('common.cancel')} onPress={props.onClose} variant="secondary" />}
      onClose={props.onClose}
      scroll={false}
      size="md"
      title={props.t('coach.routine.list.title')}
      visible={props.visible}
    >
      <ModalContent
        filtered={filtered}
        isLoading={isLoading}
        onClose={props.onClose}
        onSelect={props.onSelect}
        search={search}
        setSearch={setSearch}
        t={props.t}
      />
    </Modal>
  );
}

interface Item {
  id: string;
  name: string;
  scope: string;
}

interface ContentProps {
  search: string;
  setSearch: (v: string) => void;
  isLoading: boolean;
  filtered: Item[];
  onSelect: (id: string) => void;
  onClose: () => void;
  t: (k: string) => string;
}

function ModalContent(props: ContentProps) {
  const { search, setSearch, isLoading, filtered, onSelect, onClose, t } = props;
  return (
    <View style={styles.content}>
      <TextField
        accessibilityLabel={t('common.search')}
        onChangeText={setSearch}
        placeholder={t('common.search')}
        value={search}
      />
      <PlanListContent filtered={filtered} isLoading={isLoading} onClose={onClose} onSelect={onSelect} t={t} />
    </View>
  );
}

function usePlanData() {
  const { data: routines = [], isLoading: loadingRoutines } = useRoutineTemplatesQuery({
    summary: true,
  });
  const { data: strength = [], isLoading: loadingStrength } = usePlanTemplatesQuery({
    summary: true,
  });
  return { routines, strength, isLoading: loadingRoutines || loadingStrength };
}

function PlanListContent({
  isLoading,
  filtered,
  onSelect,
  onClose,
  t,
}: {
  isLoading: boolean;
  filtered: Item[];
  onSelect: (id: string) => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  if (isLoading) return <Text style={styles.loading}>{t('common.loading')}</Text>;
  if (filtered.length === 0) return <EmptyState title={t('coach.plans.selection.empty')} />;
  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PlanListItem item={item} onClose={onClose} onSelect={onSelect} t={t} />}
      style={styles.list}
    />
  );
}

function PlanListItem({
  item,
  onSelect,
  onClose,
  t,
}: {
  item: Item;
  onSelect: (id: string) => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  return (
    <Pressable
      onPress={() => {
        onSelect(item.id);
        onClose();
      }}
      style={styles.item}
    >
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemSubtitle}>{item.scope === 'GLOBAL' ? t('common.global') : t('common.mine')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: space.md,
    maxHeight: 420,
  },
  list: {
    marginVertical: space.sm,
  },
  item: {
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  loading: {
    textAlign: 'center',
    padding: space.xl,
    color: colors.textMuted,
  },
});
