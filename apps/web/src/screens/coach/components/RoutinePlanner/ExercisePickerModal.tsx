import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useLibraryItems, useLockBodyScroll } from './ExercisePickerModal.hooks';
import { PickerHeader, PickerBody } from './ExercisePickerModal.components';
import { s } from './ExercisePickerModal.styles';
import type { PickerProps, LibraryItem } from './ExercisePickerModal.types';
import type { BlockType } from '../../RoutinePlanner.types';
import { useUnifiedExercisesQuery, type UnifiedExerciseItem } from '../../../../data/hooks/useUnifiedLibraryQuery';
import { UnifiedExerciseDetailModal } from '../../UnifiedExerciseDetailModal';

const PICKER_CATEGORY_MAP: Record<string, string> = {
  strength: 'muscleGroups',
  cardio: 'cardioMethodTypes',
  isometric: 'isometricTypes',
  plio: 'plioTypes',
  warmup: 'mobilityTypes',
  sport: 'sportTypes',
};

function usePickerDetailItem(
  blockType: BlockType | null,
  selectedName: string | undefined,
  selectedId: string | null,
): UnifiedExerciseItem | null {
  const { data } = useUnifiedExercisesQuery({
    baseCategory: PICKER_CATEGORY_MAP[blockType ?? ''] ?? 'muscleGroups',
    search: selectedName,
  });
  if (!selectedId && !selectedName) return null;
  return (data ?? []).find((i) => i.id === selectedId || i.name === selectedName) ?? null;
}

const ANIM = 'slide' as const;

export const ExercisePickerModal = (p: PickerProps) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const { items, isLoading } = useLibraryItems(p.blockType, query);
  const selectedName = items.find((i) => i.id === selectedId)?.name;
  const detailItem = usePickerDetailItem(p.blockType, selectedName, selectedId);
  useEffect(() => {
    setQuery('');
    setSelectedId(null);
    setDetailVisible(false);
  }, [p.blockType]);
  useLockBodyScroll(!!p.blockType);
  return (
    <>
      <Modal animationType={ANIM} onRequestClose={p.onCancel} transparent visible={!!p.blockType}>
        <ModalView
          {...p}
          items={items}
          isLoading={isLoading}
          query={query}
          setQuery={setQuery}
          selectedId={selectedId}
          setSelectedId={(id) => {
            setSelectedId(id);
            setDetailVisible(true);
          }}
        />
      </Modal>
      <UnifiedExerciseDetailModal
        item={detailItem}
        onClose={() => setDetailVisible(false)}
        visible={detailVisible && !!detailItem}
      />
    </>
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
  const block: BlockType = p.blockType ?? 'strength';
  return { isNarrow, label, block };
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
      <TextInput onChangeText={setQuery} placeholder={t('coach.routine.picker.search')} style={s.search} value={query} />
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

function ModalFooter({ onCancel, t }: { onCancel: () => void; t: (k: string) => string }) {
  return (
    <Pressable onPress={onCancel} style={s.cancelBtn}>
      <Text style={s.cancelText}>{t('common.cancel')}</Text>
    </Pressable>
  );
}
