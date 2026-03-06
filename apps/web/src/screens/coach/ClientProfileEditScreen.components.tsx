import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from './ClientProfileEditScreen.styles';
import type { ProgressPhoto } from './ClientProfileEditScreen.utils';
import {
  buttonType,
  emptyAlt,
  galleryBackdropStyle,
  galleryBodyStyle,
  galleryCloseStyle,
  galleryContainerStyle,
  galleryCounterStyle,
  galleryImageStyle,
  galleryNavStyle,
  galleryTopRowStyle,
  ICON_PENCIL,
} from './ClientProfileEditScreen.utils';
import { resolvePhotoUrl } from './ClientProfileEditScreen.utils';

const numericKeyboardType = 'numeric';

export function EditableBlockCard(props: {
  editable: boolean;
  icon?: string;
  label: string;
  onChange: (value: string) => void;
  onToggleEdit: () => void;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <BlockCardHeader icon={props.icon} label={props.label} onToggleEdit={props.onToggleEdit} />
      <EditableBlockInput editable={props.editable} onChange={props.onChange} value={props.value} />
    </View>
  );
}

function BlockCardHeader(props: {
  icon?: string;
  label: string;
  onToggleEdit: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.blockHeader}>
      <View style={styles.blockLabelWrap}>
        {props.icon ? <Text style={styles.blockIcon}>{props.icon}</Text> : null}
        <Text style={styles.label}>{props.label}</Text>
      </View>
      <Pressable onPress={props.onToggleEdit} style={styles.pencilButton}>
        <Text style={styles.pencilLabel}>{ICON_PENCIL}</Text>
      </Pressable>
    </View>
  );
}

function EditableBlockInput(props: {
  editable: boolean;
  onChange: (value: string) => void;
  value: string;
}): React.JSX.Element {
  return (
    <TextInput
      editable={props.editable}
      multiline
      numberOfLines={4}
      onChangeText={props.onChange}
      style={getTextAreaStyle(props.editable)}
      value={props.value}
    />
  );
}

function getTextAreaStyle(editable: boolean) {
  return [
    styles.input,
    styles.textArea,
    editable ? styles.inputEditable : null,
    !editable ? styles.inputReadonly : null,
  ];
}

export function CompactMetricItem(props: {
  editable: boolean;
  isLarge?: boolean;
  label: string;
  onChange: (value: string) => void;
  onToggleEdit: () => void;
  suffix: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.compactMetricRow}>
      <MetricLabel label={props.label} onToggleEdit={props.onToggleEdit} />
      {props.editable ? <MetricInput {...props} /> : <MetricValue {...props} />}
    </View>
  );
}

function MetricLabel(props: { label: string; onToggleEdit: () => void }): React.JSX.Element {
  return (
    <View style={styles.compactMetricLabelWrap}>
      <Text style={styles.metricLabel}>{props.label}</Text>
      <Pressable onPress={props.onToggleEdit} style={styles.pencilButton}>
        <Text style={styles.pencilLabel}>{ICON_PENCIL}</Text>
      </Pressable>
    </View>
  );
}

function MetricInput(props: {
  isLarge?: boolean;
  onChange: (value: string) => void;
  value: string;
}): React.JSX.Element {
  return (
    <TextInput
      keyboardType={numericKeyboardType}
      onChangeText={props.onChange}
      style={[styles.input, props.isLarge ? styles.metricInputLarge : styles.compactMetricInput]}
      value={props.value}
    />
  );
}

function MetricValue(props: {
  isLarge?: boolean;
  suffix: string;
  value: string;
}): React.JSX.Element {
  const fallbackValue = '--';
  return (
    <Text style={[styles.compactMetricValue, props.isLarge ? styles.metricValueLarge : null]}>
      {props.value || fallbackValue}
      {props.value ? props.suffix : ''}
    </Text>
  );
}

export function PhotoGalleryModal(props: {
  closeIcon: string;
  counter: string;
  index: number;
  navNextIcon: string;
  navPrevIcon: string;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  photos: ProgressPhoto[];
}): null | React.JSX.Element {
  const current = props.photos[props.index];
  if (!current) return null;
  return (
    <div onClick={props.onClose} style={galleryBackdropStyle}>
      <div onClick={stopClickPropagation} style={galleryContainerStyle}>
        <GalleryTopRow
          closeIcon={props.closeIcon}
          counter={props.counter}
          onClose={props.onClose}
        />
        <GalleryBody current={current} {...props} />
      </div>
    </div>
  );
}

function stopClickPropagation(event: React.MouseEvent<HTMLDivElement>): void {
  event.stopPropagation();
}

function GalleryTopRow(props: {
  closeIcon: string;
  counter: string;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div style={galleryTopRowStyle}>
      <span style={galleryCounterStyle}>{props.counter}</span>
      <button onClick={props.onClose} style={galleryCloseStyle} type={buttonType}>
        {props.closeIcon}
      </button>
    </div>
  );
}

function GalleryBody(props: {
  current: ProgressPhoto;
  navNextIcon: string;
  navPrevIcon: string;
  onNext: () => void;
  onPrev: () => void;
}): React.JSX.Element {
  return (
    <div style={galleryBodyStyle}>
      <button onClick={props.onPrev} style={galleryNavStyle} type={buttonType}>
        {props.navPrevIcon}
      </button>
      <img
        alt={emptyAlt}
        src={resolvePhotoUrl(props.current.imageUrl, props.current.imagePath)}
        style={galleryImageStyle}
      />
      <button onClick={props.onNext} style={galleryNavStyle} type={buttonType}>
        {props.navNextIcon}
      </button>
    </div>
  );
}
