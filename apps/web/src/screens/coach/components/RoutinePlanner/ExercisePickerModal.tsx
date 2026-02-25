import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useLibraryItems, useLockBodyScroll } from './ExercisePickerModal.hooks';
import { PickerHeader, PickerBody, DetailPanel } from './ExercisePickerModal.components';
import { s } from './ExercisePickerModal.styles';
import type { PickerProps, LibraryItem } from './ExercisePickerModal.types';
import type { BlockType } from '../../RoutinePlanner.types';

const ANIM = 'slide' as const;

export const ExercisePickerModal = (p: PickerProps) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { items, isLoading } = useLibraryItems(p.blockType, query);
  useEffect(() => {
    setQuery('');
    setSelectedId(null);
  }, [p.blockType]);
  useLockBodyScroll(!!p.blockType);
  return (
    <Modal animationType={ANIM} onRequestClose={p.onCancel} transparent visible={!!p.blockType}>
      <ModalView
        {...p}
        items={items}
        isLoading={isLoading}
        query={query}
        setQuery={setQuery}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
      />
    </Modal>
  );
};

const Layout = (p: { isNarrow: boolean; children: React.ReactNode }) => (
  <View style={[s.body, p.isNarrow ? s.bodyColumn : s.bodyRow]}>{p.children}</View>
);

interface ModalViewProps extends PickerProps {
  items: LibraryItem[];
  isLoading: boolean;
  query: string;
  setQuery: (v: string) => void;
  selectedId: string | null;
  setSelectedId: (v: string | null) => void;
}

const ModalView = (p: ModalViewProps) => {
  const layout = useModalLayout(p);
  return (
    <View style={s.overlay}>
      <View style={s.sheet}>
        <ModalHeader label={layout.label} query={p.query} setQuery={p.setQuery} t={p.t} />
        <ModalBody
          block={layout.block}
          isLoading={p.isLoading}
          items={p.items}
          isNarrow={layout.isNarrow}
          onSelect={p.onSelect}
          onViewDetail={p.setSelectedId}
          selected={layout.selected}
          t={p.t}
        />
        <ModalFooter onCancel={p.onCancel} t={p.t} />
      </View>
    </View>
  );
};

function useModalLayout(p: ModalViewProps) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 980;
  const label = p.blockType ? p.t(`coach.routine.blockType.${p.blockType}`) : '';
  const selected = useMemo(
    () => p.items.find((item) => item.id === p.selectedId) ?? null,
    [p.items, p.selectedId],
  );
  const block: BlockType = p.blockType ?? 'strength';
  return { isNarrow, label, selected, block };
}

function ModalHeader({
  label,
  query,
  setQuery,
  t,
}: {
  label: string;
  query: string;
  setQuery: (v: string) => void;
  t: (k: string) => string;
}) {
  return (
    <>
      <PickerHeader label={label} t={t} />
      <TextInput
        onChangeText={setQuery}
        placeholder={t('coach.routine.picker.search')}
        style={s.search}
        value={query}
      />
    </>
  );
}

interface ModalBodyProps {
  block: BlockType;
  isLoading: boolean;
  items: LibraryItem[];
  isNarrow: boolean;
  onSelect: (libraryId: string, displayName: string) => void;
  onViewDetail: (id: string) => void;
  selected: LibraryItem | null;
  t: (k: string) => string;
}

const ModalBody = (p: ModalBodyProps) => (
  <Layout isNarrow={p.isNarrow}>
    <ModalListColumn
      block={p.block}
      isLoading={p.isLoading}
      items={p.items}
      isNarrow={p.isNarrow}
      onSelect={p.onSelect}
      onViewDetail={p.onViewDetail}
      t={p.t}
    />
    <ModalDetailColumn block={p.block} selected={p.selected} t={p.t} />
  </Layout>
);

interface ModalListColumnProps {
  block: BlockType;
  isLoading: boolean;
  items: LibraryItem[];
  isNarrow: boolean;
  onSelect: (libraryId: string, displayName: string) => void;
  onViewDetail: (id: string) => void;
  t: (k: string) => string;
}

const ModalListColumn = (p: ModalListColumnProps) => (
  <View style={s.listColumn}>
    <PickerBody
      blockType={p.block}
      isLoading={p.isLoading}
      items={p.items}
      numColumns={p.isNarrow ? 1 : 2}
      onSelect={p.onSelect}
      onViewDetail={p.onViewDetail}
      t={p.t}
    />
  </View>
);

interface ModalDetailColumnProps {
  block: BlockType;
  selected: LibraryItem | null;
  t: (k: string) => string;
}

const ModalDetailColumn = (p: ModalDetailColumnProps) => (
  <View style={s.detailColumn}>
    <DetailPanel blockType={p.block} item={p.selected} t={p.t} />
  </View>
);

function ModalFooter({ onCancel, t }: { onCancel: () => void; t: (k: string) => string }) {
  return (
    <Pressable onPress={onCancel} style={s.cancelBtn}>
      <Text style={s.cancelText}>{t('common.cancel')}</Text>
    </Pressable>
  );
}
