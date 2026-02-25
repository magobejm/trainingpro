import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoutineTemplatesQuery } from '../../../data/hooks/useRoutineTemplates';
import { usePlanTemplatesQuery } from '../../../data/hooks/usePlanTemplates';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (planId: string) => void;
  t: (key: string) => string;
};

const ANIMATION_FADE = 'fade' as const;

export function PlanSelectionModal(props: Props): React.JSX.Element {
  const { routines, strength, isLoading } = usePlanData();
  const [search, setSearch] = useState('');
  const allTemplates = [...routines, ...strength];
  const filtered = allTemplates.filter((tpl) =>
    tpl.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal
      animationType={ANIMATION_FADE}
      onRequestClose={props.onClose}
      transparent
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
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('coach.routine.list.title')}</Text>
        <TextInput
          onChangeText={setSearch}
          placeholder={t('common.search')}
          style={styles.input}
          value={search}
        />
        <PlanListContent
          filtered={filtered}
          isLoading={isLoading}
          onClose={onClose}
          onSelect={onSelect}
          t={t}
        />
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeLabel}>{t('common.cancel')}</Text>
        </Pressable>
      </View>
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
  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PlanListItem item={item} onClose={onClose} onSelect={onSelect} t={t} />
      )}
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
      <Text style={styles.itemSubtitle}>
        {item.scope === 'GLOBAL' ? t('common.global') : t('common.mine')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  list: {
    marginVertical: 8,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loading: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  closeLabel: {
    fontWeight: 'bold',
    color: '#000',
  },
});
