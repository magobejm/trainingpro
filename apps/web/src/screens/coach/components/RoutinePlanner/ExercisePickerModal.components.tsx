import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
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
import { Badge, Button, EmptyState } from '@trainerpro/ui';

const IMAGE_RESIZE_MODE: ImageProps['resizeMode'] = 'contain';

export function PickerTypeBar({
  activeType,
  allowedTypes,
  onChange,
  t,
}: {
  activeType: BlockType;
  allowedTypes: BlockType[];
  onChange: (type: BlockType) => void;
  t: (k: string) => string;
}) {
  return (
    <View style={s.typeBar}>
      {allowedTypes.map((type) => {
        const active = type === activeType;
        return (
          <Pressable key={type} onPress={() => onChange(type)} style={[s.typeBtn, active && s.typeBtnActive]}>
            <Text style={[s.typeBtnText, active && s.typeBtnTextActive]}>{t(`coach.routine.blockType.${type}`)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface CardActionsProps {
  isAdded: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
  t: (k: string) => string;
}

const CardActions = ({ isAdded, onSelect, onViewDetail, t }: CardActionsProps) => (
  <View style={s.cardActions}>
    <Button
      label={t('coach.routine.picker.actions.viewDetails')}
      onPress={onViewDetail}
      size="sm"
      style={s.cardAction}
      variant="secondary"
    />
    <Button
      label={isAdded ? t('coach.routine.picker.added') : t('coach.routine.picker.actions.select')}
      onPress={onSelect}
      size="sm"
      style={s.cardAction}
      variant={isAdded ? 'secondary' : 'primary'}
    />
  </View>
);

const CardImage = ({ blockType, url }: { blockType: BlockType; url: string | null }) => (
  <View style={s.cardImageFrame}>
    <Image resizeMode={IMAGE_RESIZE_MODE} source={{ uri: getFullUrl(blockType, url) }} style={s.cardImage} />
  </View>
);

interface PickerCardProps {
  blockType: BlockType;
  isAdded: boolean;
  item: LibraryItem;
  onSelect: (id: string, name: string) => void;
  onViewDetail: (id: string) => void;
  t: (k: string) => string;
}

export const PickerCard = ({ blockType, isAdded, item, onSelect, onViewDetail, t }: PickerCardProps) => (
  <View style={s.card}>
    <CardImage blockType={blockType} url={item.imageUrl} />
    <View style={s.cardBody}>
      <Text numberOfLines={1} style={s.cardTitle}>
        {item.name}
      </Text>
      <Text numberOfLines={2} style={s.cardSubtitle}>
        {item.description || item.notes || t('coach.routine.picker.card.empty')}
      </Text>
      {isAdded ? (
        <View style={s.cardAddedBadge}>
          <Badge label={t('coach.routine.picker.added')} tone="success" />
        </View>
      ) : null}
      <CardActions
        isAdded={isAdded}
        onSelect={() => onSelect(item.id, item.name)}
        onViewDetail={() => onViewDetail(item.id)}
        t={t}
      />
    </View>
  </View>
);

interface BodyProps {
  addedIds: Set<string>;
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
  if (!p.items.length) return <EmptyState title={p.t('coach.routine.picker.empty')} />;
  const renderItem: ListRenderItem<LibraryItem> = ({ item }) => (
    <PickerCard
      blockType={p.blockType}
      isAdded={p.addedIds.has(item.id)}
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
      <MediaSection blockType={p.blockType} imageUrl={p.item.imageUrl} t={p.t} youtubeUrl={p.item.youtubeUrl || null} />
      <View style={s.detailContent}>
        <Text style={s.detailName}>{p.item.name}</Text>
        <DetailTags categoryLabel={categoryLabel} equipmentLabel={equipmentLabel} />
        <DetailSection label={p.t('coach.routine.picker.details.description')} value={description} />
        {p.item.notes ? <DetailSection label={p.t('coach.routine.picker.details.notes')} value={p.item.notes} /> : null}
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

function DetailTags(props: { categoryLabel: null | string | undefined; equipmentLabel: null | string }) {
  return (
    <View style={s.tagsRow}>
      {props.categoryLabel ? <Badge label={props.categoryLabel} tone="primary" /> : null}
      {props.equipmentLabel ? <Badge label={props.equipmentLabel} tone="info" /> : null}
    </View>
  );
}
