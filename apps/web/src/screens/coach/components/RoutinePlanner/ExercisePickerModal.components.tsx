import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageProps,
  type ListRenderItem,
} from 'react-native';
import type { BlockType } from '../../RoutinePlanner.types';
import { LibraryMediaViewer } from '../LibraryMediaViewer';
import type { LibraryItem } from './ExercisePickerModal.types';
import { getFullUrl } from './ExercisePickerModal.utils';
import { s } from './ExercisePickerModal.styles';

const IMAGE_RESIZE_MODE: ImageProps['resizeMode'] = 'contain';

export const PickerHeader = ({ label, t }: { label: string; t: (k: string) => string }) => {
  const separator = t('coach.routine.picker.separator');
  return (
    <Text style={s.title}>
      {t('coach.routine.picker.title')}
      {separator}
      {label}
    </Text>
  );
};

interface CardActionsProps {
  onSelect: () => void;
  onViewDetail: () => void;
  t: (k: string) => string;
}

const CardActions = ({ onSelect, onViewDetail, t }: CardActionsProps) => (
  <View style={s.cardActions}>
    <Pressable onPress={onViewDetail} style={s.cardGhostBtn}>
      <Text style={s.cardGhostText}>{t('coach.routine.picker.actions.viewDetails')}</Text>
    </Pressable>
    <Pressable onPress={onSelect} style={s.cardPrimaryBtn}>
      <Text style={s.cardPrimaryText}>{t('coach.routine.picker.actions.select')}</Text>
    </Pressable>
  </View>
);

const CardImage = ({ blockType, url }: { blockType: BlockType; url: string | null }) => (
  <View style={s.cardImageFrame}>
    <Image
      resizeMode={IMAGE_RESIZE_MODE}
      source={{ uri: getFullUrl(blockType, url) }}
      style={s.cardImage}
    />
  </View>
);

interface PickerCardProps {
  blockType: BlockType;
  item: LibraryItem;
  onSelect: (id: string, name: string) => void;
  onViewDetail: (id: string) => void;
  t: (k: string) => string;
}

export const PickerCard = ({ blockType, item, onSelect, onViewDetail, t }: PickerCardProps) => (
  <View style={s.card}>
    <CardImage blockType={blockType} url={item.imageUrl} />
    <View style={s.cardBody}>
      <Text numberOfLines={1} style={s.cardTitle}>
        {item.name}
      </Text>
      <Text numberOfLines={2} style={s.cardSubtitle}>
        {item.description || item.notes || t('coach.routine.picker.card.empty')}
      </Text>
      <CardActions
        onSelect={() => onSelect(item.id, item.name)}
        onViewDetail={() => onViewDetail(item.id)}
        t={t}
      />
    </View>
  </View>
);

interface BodyProps {
  blockType: BlockType;
  items: LibraryItem[];
  isLoading: boolean;
  onSelect: (id: string, n: string) => void;
  onViewDetail: (id: string) => void;
  t: (k: string) => string;
  numColumns: number;
}

export const PickerBody = (p: BodyProps) => {
  if (p.isLoading) return <ActivityIndicator style={s.loader} />;
  if (!p.items.length) return <Text style={s.empty}>{p.t('coach.routine.picker.empty')}</Text>;
  const renderItem: ListRenderItem<LibraryItem> = ({ item }) => (
    <PickerCard
      blockType={p.blockType}
      item={item}
      onSelect={p.onSelect}
      onViewDetail={p.onViewDetail}
      t={p.t}
    />
  );
  return (
    <FlatList
      columnWrapperStyle={p.numColumns > 1 ? s.cardRow : undefined}
      contentContainerStyle={s.cardGrid}
      data={p.items}
      key={String(p.numColumns)}
      keyExtractor={(item) => item.id}
      numColumns={p.numColumns}
      renderItem={renderItem}
      style={s.list}
    />
  );
};

const DetailSection = ({ label, value }: { label: string; value: string }) => (
  <View style={s.detailSection}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={s.detailValue}>{value}</Text>
  </View>
);

interface DetailPanelProps {
  blockType: BlockType;
  item: LibraryItem | null;
  t: (k: string) => string;
}

export const DetailPanel = (p: DetailPanelProps) => {
  if (!p.item) {
    return (
      <View style={s.detailEmpty}>
        <Text style={s.detailEmptyText}>{p.t('coach.routine.picker.details.empty')}</Text>
      </View>
    );
  }
  const categoryLabel = p.blockType === 'strength' ? p.item.muscleGroup : p.item.methodType;
  const equipmentLabel = readEquipmentLabel(p);
  const description = readDescription(p);
  return renderDetailPanel(p, categoryLabel, equipmentLabel, description);
};

function readDescription(p: DetailPanelProps): string {
  return p.item?.description || p.t('coach.routine.picker.details.descriptionEmpty');
}

function readEquipmentLabel(p: DetailPanelProps): null | string {
  if (!p.item?.equipment) return null;
  return `${p.t('coach.library.exercises.detail.equipment')} ${p.item.equipment}`;
}

function renderDetailPanel(
  p: DetailPanelProps,
  categoryLabel: null | string | undefined,
  equipmentLabel: null | string,
  description: string,
) {
  if (!p.item) return null;

  return (
    <View style={s.detailPanel}>
      <MediaSection
        blockType={p.blockType}
        imageUrl={p.item.imageUrl}
        t={p.t}
        youtubeUrl={p.item.youtubeUrl || null}
      />
      <View style={s.detailContent}>
        <Text style={s.detailName}>{p.item.name}</Text>
        <DetailTags categoryLabel={categoryLabel} equipmentLabel={equipmentLabel} />
        <DetailSection
          label={p.t('coach.routine.picker.details.description')}
          value={description}
        />
        {p.item.notes ? (
          <DetailSection label={p.t('coach.routine.picker.details.notes')} value={p.item.notes} />
        ) : null}
      </View>
    </View>
  );
}

function MediaSection(props: {
  blockType: BlockType;
  imageUrl: null | string;
  t: (k: string) => string;
  youtubeUrl: null | string;
}) {
  return (
    <View style={s.detailMediaWrapper}>
      <LibraryMediaViewer
        category={props.blockType}
        fullWidth={true}
        imageUrl={getFullUrl(props.blockType, props.imageUrl)}
        t={props.t}
        youtubeUrl={props.youtubeUrl}
      />
    </View>
  );
}

function DetailTags(props: {
  categoryLabel: null | string | undefined;
  equipmentLabel: null | string;
}) {
  return (
    <View style={tagStyles.tagsRow}>
      {props.categoryLabel ? (
        <View style={[tagStyles.tag, tagStyles.primaryTag]}>
          <Text style={tagStyles.primaryTagText}>{props.categoryLabel}</Text>
        </View>
      ) : null}
      {props.equipmentLabel ? (
        <View style={[tagStyles.tag, tagStyles.secondaryTag]}>
          <Text style={tagStyles.secondaryTagText}>{props.equipmentLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const tagStyles = StyleSheet.create({
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryTag: {
    backgroundColor: '#dbeafe',
  },
  primaryTagText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryTag: {
    backgroundColor: '#f3e8ff',
  },
  secondaryTagText: {
    color: '#9333ea',
    fontSize: 12,
    fontWeight: '600',
  },
});
