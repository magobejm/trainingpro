import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useLibraryItems, useLockBodyScroll } from './ExercisePickerModal.hooks';
import { PickerHeader, PickerBody, PickerTypeBar } from './ExercisePickerModal.components';
import { s } from './ExercisePickerModal.styles';
import { DEFAULT_PICKER_BLOCK_TYPES, type PickerProps, type LibraryItem } from './ExercisePickerModal.types';
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
  const allowedTypes = p.allowedTypes ?? DEFAULT_PICKER_BLOCK_TYPES;
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<BlockType>('strength');
  const [addedIds, setAddedIds] = useState<Set<string>>(() => new Set());
  const [addedCount, setAddedCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const { items, isLoading } = useLibraryItems(activeType, query);
  const selectedName = items.find((i) => i.id === selectedId)?.name;
  const detailItem = usePickerDetailItem(activeType, selectedName, selectedId);

  useEffect(() => {
    if (!p.blockType) return;
    const initial = allowedTypes.includes(p.blockType) ? p.blockType : (allowedTypes[0] ?? 'strength');
    setActiveType(initial);
    setQuery('');
    setAddedIds(new Set());
    setAddedCount(0);
    setSelectedId(null);
    setDetailVisible(false);
  }, [p.blockType, allowedTypes]);

  useEffect(() => {
    setQuery('');
    setSelectedId(null);
    setDetailVisible(false);
  }, [activeType]);

  useLockBodyScroll(!!p.blockType);

  function handleSelect(libraryId: string, displayName: string) {
    p.onSelect(libraryId, displayName, activeType);
    setAddedIds((prev) => new Set(prev).add(libraryId));
    setAddedCount((count) => count + 1);
  }

  return (
    <>
      <Modal animationType={ANIM} onRequestClose={p.onCancel} transparent visible={!!p.blockType}>
        <ModalView
          {...p}
          activeType={activeType}
          addedCount={addedCount}
          addedIds={addedIds}
          allowedTypes={allowedTypes}
          isLoading={isLoading}
          items={items}
          onSelect={handleSelect}
          query={query}
          setActiveType={setActiveType}
          setQuery={setQuery}
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

interface ModalViewProps extends Omit<PickerProps, 'onSelect'> {
  activeType: BlockType;
  addedCount: number;
  addedIds: Set<string>;
  allowedTypes: BlockType[];
  items: LibraryItem[];
  isLoading: boolean;
  onSelect: (libraryId: string, displayName: string) => void;
  query: string;
  setActiveType: (type: BlockType) => void;
  setQuery: (v: string) => void;
  setSelectedId: (v: string | null) => void;
}

const ModalView = (p: ModalViewProps) => {
  const layout = useModalLayout();
  return (
    <View style={s.overlay}>
      <View style={s.sheet}>
        <PickerHeader t={p.t} />
        <PickerTypeBar activeType={p.activeType} allowedTypes={p.allowedTypes} onChange={p.setActiveType} t={p.t} />
        <TextInput
          onChangeText={p.setQuery}
          placeholder={p.t('coach.routine.picker.search')}
          style={s.search}
          value={p.query}
        />
        <ModalBody
          addedIds={p.addedIds}
          block={p.activeType}
          isLoading={p.isLoading}
          items={p.items}
          isNarrow={layout.isNarrow}
          onSelect={p.onSelect}
          onViewDetail={p.setSelectedId}
          t={p.t}
        />
        <ModalFooter addedCount={p.addedCount} onDone={p.onCancel} t={p.t} />
      </View>
    </View>
  );
};

function useModalLayout() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 980;
  return { isNarrow };
}

interface ModalBodyProps {
  addedIds: Set<string>;
  block: BlockType;
  isLoading: boolean;
  items: LibraryItem[];
  isNarrow: boolean;
  onSelect: (libraryId: string, displayName: string) => void;
  onViewDetail: (id: string) => void;
  t: (k: string, options?: { count: number }) => string;
}

const ModalBody = (p: ModalBodyProps) => (
  <Layout isNarrow={p.isNarrow}>
    <ModalListColumn
      addedIds={p.addedIds}
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
  addedIds: Set<string>;
  block: BlockType;
  isLoading: boolean;
  items: LibraryItem[];
  isNarrow: boolean;
  onSelect: (libraryId: string, displayName: string) => void;
  onViewDetail: (id: string) => void;
  t: (k: string, options?: { count: number }) => string;
}

const ModalListColumn = (p: ModalListColumnProps) => (
  <View style={s.listColumn}>
    <PickerBody
      addedIds={p.addedIds}
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

function ModalFooter({
  addedCount,
  onDone,
  t,
}: {
  addedCount: number;
  onDone: () => void;
  t: (k: string, options?: { count: number }) => string;
}) {
  return (
    <View style={s.footer}>
      <Text style={s.footerCount}>{addedCount > 0 ? t('coach.routine.picker.addedCount', { count: addedCount }) : ''}</Text>
      <Pressable onPress={onDone} style={s.doneBtn}>
        <Text style={s.doneBtnText}>{t('coach.routine.picker.done')}</Text>
      </Pressable>
    </View>
  );
}
