import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './ClientProfileEditScreen.styles';
import { CompactMetricItem } from './ClientProfileEditScreen.components';
import type { Labels } from './ClientProfileEditScreen.labels';
import type { useClientProfileEditState } from './ClientProfileEditScreen.hooks';
import {
  buttonType,
  carouselArrowStyle,
  carouselRailStyle,
  carouselWrapStyle,
  dateInputStyle,
  dateInputType,
  emptyAlt,
  headerAvatarBackgroundStyle,
  headerAvatarHoverStyle,
  headerAvatarStyle,
  ICON_NEXT,
  ICON_PENCIL,
  ICON_PLUS,
  ICON_PREV,
  scrollRail,
} from './ClientProfileEditScreen.utils';

type Vm = ReturnType<typeof useClientProfileEditState>;
type MetricKey = 'fcMax' | 'fcRest' | 'heightCm' | 'hipCm' | 'waistCm' | 'weightKg';

export function HeaderCard(props: { labels: Labels; vm: Vm }): React.JSX.Element {
  const avatarUrl = resolveAvatarUrl(props.vm);
  const ageValue = props.vm.data.age === null ? '--' : `${props.vm.data.age}`;
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <AvatarColumn avatarUrl={avatarUrl} vm={props.vm} />
        <HeaderMetrics ageValue={ageValue} labels={props.labels} vm={props.vm} />
      </View>
    </View>
  );
}

function resolveAvatarUrl(vm: Vm): string {
  return (
    vm.state.form.avatarUrl ||
    String(vm.query.data?.avatarUrl ?? '') ||
    vm.data.avatarChoices[0] ||
    ''
  );
}

function AvatarColumn(props: { avatarUrl: string; vm: Vm }): React.JSX.Element {
  return (
    <View style={styles.avatarColumn}>
      <AvatarPicker avatarUrl={props.avatarUrl} vm={props.vm} />
      <AvatarRail avatarUrl={props.avatarUrl} vm={props.vm} />
    </View>
  );
}

function AvatarPicker(props: { avatarUrl: string; vm: Vm }): React.JSX.Element {
  const vm = props.vm;
  return (
    <Pressable
      onHoverIn={() => vm.state.setHoveredAvatar(true)}
      onHoverOut={() => vm.state.setHoveredAvatar(false)}
      onPress={() => void selectPendingAvatar(vm)}
      style={styles.avatarWrap}
    >
      <img alt={emptyAlt} src={props.avatarUrl} style={headerAvatarBackgroundStyle} />
      <img alt={emptyAlt} src={props.avatarUrl} style={avatarStyle(vm.state.hoveredAvatar)} />
      {vm.state.hoveredAvatar ? <AvatarOverlay /> : null}
    </Pressable>
  );
}

function AvatarOverlay(): React.JSX.Element {
  return (
    <View style={styles.avatarOverlay}>
      <Text style={styles.avatarOverlayPlus}>{ICON_PLUS}</Text>
    </View>
  );
}

function avatarStyle(hovered: boolean): React.CSSProperties {
  return { ...headerAvatarStyle, ...(hovered ? headerAvatarHoverStyle : {}) };
}

async function selectPendingAvatar(vm: Vm): Promise<void> {
  const mod = await import('./client-profile.avatar');
  const file = await mod.pickImageFile();
  if (!file) return;
  if (vm.state.pendingAvatarPreviewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(vm.state.pendingAvatarPreviewUrl);
  }
  const previewUrl = URL.createObjectURL(file);
  vm.state.setPendingAvatarFile(file);
  vm.state.setPendingAvatarPreviewUrl(previewUrl);
  vm.state.setForm((prev) => ({ ...prev, avatarUrl: previewUrl }));
}

function AvatarRail(props: { avatarUrl: string; vm: Vm }): React.JSX.Element {
  const vm = props.vm;
  return (
    <div style={carouselWrapStyle}>
      <CarouselArrow
        icon={ICON_PREV}
        onClick={() => scrollRail(vm.refs.avatarRailRef.current, -220)}
      />
      <div ref={vm.refs.avatarRailRef} style={carouselRailStyle}>
        {vm.data.avatarChoices.map((url) => (
          <Pressable
            key={url}
            onPress={() => setAvatar(vm, url)}
            style={avatarItemStyle(props.avatarUrl, url)}
          >
            <img alt={emptyAlt} src={url} style={styles.avatarOptionImage} />
          </Pressable>
        ))}
      </div>
      <CarouselArrow
        icon={ICON_NEXT}
        onClick={() => scrollRail(vm.refs.avatarRailRef.current, 220)}
      />
    </div>
  );
}

function CarouselArrow(props: { icon: string; onClick: () => void }): React.JSX.Element {
  return (
    <button onClick={props.onClick} style={carouselArrowStyle} type={buttonType}>
      {props.icon}
    </button>
  );
}

function setAvatar(vm: Vm, url: string): void {
  vm.state.setForm((prev) => ({ ...prev, avatarUrl: url }));
}

function avatarItemStyle(currentUrl: string, url: string) {
  return [styles.avatarOption, currentUrl === url ? styles.avatarOptionActive : null];
}

function HeaderMetrics(props: { ageValue: string; labels: Labels; vm: Vm }): React.JSX.Element {
  return (
    <View style={styles.headerText}>
      <Text style={styles.title}>{props.vm.data.fullName}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.activeSinceText}>{props.labels.activeSince}</Text>
        <Text style={styles.subtitle}>{props.vm.data.lastSessionLabel}</Text>
      </View>
      <View style={styles.topFramesRow}>
        <MetricFrames labels={props.labels} vm={props.vm} />
        <AgeFrame ageValue={props.ageValue} labels={props.labels} vm={props.vm} />
      </View>
    </View>
  );
}

function MetricFrames(props: { labels: Labels; vm: Vm }): React.JSX.Element {
  return (
    <>
      <MainMetricFrame labels={props.labels} vm={props.vm} />
      <WeightFrame labels={props.labels} vm={props.vm} />
    </>
  );
}

function MainMetricFrame(props: { labels: Labels; vm: Vm }): React.JSX.Element {
  return (
    <View style={[styles.frameCard, styles.multiMetricsFrame]}>
      <MetricField
        field={'heightCm'}
        isLarge
        label={props.labels.height}
        suffix={'cm'}
        vm={props.vm}
      />
      <MetricPair
        labels={props.labels}
        suffix={'cm'}
        vm={props.vm}
        leftField={'waistCm'}
        rightField={'hipCm'}
      />
      <MetricPair
        labels={props.labels}
        suffix={'bpm'}
        vm={props.vm}
        leftField={'fcMax'}
        rightField={'fcRest'}
      />
    </View>
  );
}

function WeightFrame(props: { labels: Labels; vm: Vm }): React.JSX.Element {
  return (
    <View style={[styles.frameCard, styles.weightFrame]}>
      <MetricField
        field={'weightKg'}
        isLarge
        label={props.labels.weight}
        suffix={'kg'}
        vm={props.vm}
      />
    </View>
  );
}

function MetricPair(props: {
  labels: Labels;
  leftField: 'fcMax' | 'waistCm';
  rightField: 'fcRest' | 'hipCm';
  suffix: string;
  vm: Vm;
}): React.JSX.Element {
  return (
    <View style={styles.compactRowPair}>
      <View style={styles.compactMetricHalf}>
        <MetricField
          field={props.leftField}
          label={props.labels[props.leftField === 'waistCm' ? 'waist' : 'fcMax']}
          suffix={props.suffix}
          vm={props.vm}
        />
      </View>
      <View style={styles.compactMetricHalf}>
        <MetricField
          field={props.rightField}
          label={props.labels[props.rightField === 'hipCm' ? 'hip' : 'fcRest']}
          suffix={props.suffix}
          vm={props.vm}
        />
      </View>
    </View>
  );
}

function MetricField(props: {
  field: MetricKey;
  isLarge?: boolean;
  label: string;
  suffix: string;
  vm: Vm;
}): React.JSX.Element {
  return (
    <CompactMetricItem
      editable={Boolean(props.vm.state.editableMetrics[props.field])}
      isLarge={props.isLarge}
      label={props.label}
      onChange={(value) => setFieldValue(props.vm, props.field, value)}
      onToggleEdit={() => toggleMetric(props.vm, props.field)}
      suffix={props.suffix}
      value={props.vm.state.form[props.field as keyof typeof props.vm.state.form] as string}
    />
  );
}

function setFieldValue(vm: Vm, field: 'avatarUrl' | 'birthDate' | MetricKey, value: string): void {
  vm.state.setForm((prev) => ({ ...prev, [field]: value }));
}

function toggleMetric(vm: Vm, field: MetricKey): void {
  vm.state.setEditableMetrics((prev) => ({ ...prev, [field]: !prev[field] }));
}

function AgeFrame(props: { ageValue: string; labels: Labels; vm: Vm }): React.JSX.Element {
  const vm = props.vm;
  return (
    <View style={[styles.frameCard, styles.ageFrame]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{props.labels.age}</Text>
        <Pressable
          onPress={() => vm.state.setEditableBirthDate((prev) => !prev)}
          style={styles.pencilButton}
        >
          <Text style={styles.pencilLabel}>{ICON_PENCIL}</Text>
        </Pressable>
      </View>
      <Text style={styles.metricBigValue}>{props.ageValue}</Text>
      {vm.state.editableBirthDate ? (
        <BirthDateInput vm={vm} />
      ) : (
        <Text style={styles.metricDateValue}>{vm.data.birthDateLabel}</Text>
      )}
    </View>
  );
}

function BirthDateInput(props: { vm: Vm }): React.JSX.Element {
  return (
    <input
      onChange={(event) => setFieldValue(props.vm, 'birthDate', event.target.value)}
      style={dateInputStyle}
      type={dateInputType}
      value={props.vm.state.form.birthDate}
    />
  );
}
