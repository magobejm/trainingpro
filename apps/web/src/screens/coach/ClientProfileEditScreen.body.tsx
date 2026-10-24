import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Select, TextField, useBreakpoint } from '@trainerpro/ui';
import { styles } from './ClientProfileEditScreen.styles';
import { ProfileFieldsSection } from './components/EditClientProfileModal.fields';
import { EditableBlockCard } from './ClientProfileEditScreen.components';
import { ProgressPhotosPanel } from './ClientProfileEditScreen.progress';
import { ClientMeasurementHistory } from './ClientMeasurementHistory';
import type { Labels } from './ClientProfileEditScreen.labels';
import type { useClientProfileEditState } from './ClientProfileEditScreen.hooks';
import { ICON_ALERT, ICON_IDEA, ICON_INJURY, ICON_NOTE } from './ClientProfileEditScreen.utils';
import { AccountCard } from './ClientProfileEditScreen.account';

const VARIANT_SECONDARY = 'secondary' as const;
const FITNESS_LEVELS = [
  { key: 'unspecified', value: '' },
  { key: 'beginner', value: 'beginner' },
  { key: 'intermediate', value: 'intermediate' },
  { key: 'advanced', value: 'advanced' },
  { key: 'elite', value: 'elite' },
];

type Vm = ReturnType<typeof useClientProfileEditState>;
type Translate = (key: string, options?: Record<string, unknown>) => string;
type EditableSectionKey = 'allergies' | 'considerations' | 'injuries' | 'notes';

export function MainLayout(props: { labels: Labels; onArchived?: () => void; t: Translate; vm: Vm }): React.JSX.Element {
  return (
    <View style={styles.mainLayout}>
      <MainColumn labels={props.labels} t={props.t} vm={props.vm} />
      <SideColumn labels={props.labels} onArchived={props.onArchived} t={props.t} vm={props.vm} />
    </View>
  );
}

function MainColumn(props: { labels: Labels; t: Translate; vm: Vm }): React.JSX.Element {
  const vm = props.vm;
  const stacked = useBreakpoint() !== 'lg';
  return (
    <View style={[styles.mainColumn, stacked && styles.stackedColumn]}>
      <ObjectivesCard labels={props.labels} vm={vm} />
      <ProfileCard labels={props.labels} t={props.t} vm={vm} />
      <ProgressPanel labels={props.labels} t={props.t} vm={vm} />
      <EditableBlockCard
        editable={Boolean(vm.state.editableSections.notes)}
        icon={ICON_NOTE}
        label={props.labels.notes}
        onChange={(value) => setFormField(vm, 'notes', value)}
        onToggleEdit={() => toggleEditableSection(vm, 'notes')}
        value={vm.state.form.notes}
      />
    </View>
  );
}

function ProgressPanel(props: { labels: Labels; t: Translate; vm: Vm }): React.JSX.Element {
  const vm = props.vm;
  return (
    <>
      <ProgressPhotosPanel
        archivePhoto={vm.actions.archivePhoto}
        archivedPhotos={vm.data.archivedPhotos}
        draggedPhotoId={vm.state.draggedPhotoId}
        formatLocale={'es-ES'}
        hoveredPhotoId={vm.state.hoveredPhotoId}
        labels={props.labels.progress}
        photoRailRef={vm.refs.photoRailRef}
        restorePhoto={vm.actions.restorePhoto}
        setDraggedPhotoId={vm.state.setDraggedPhotoId}
        setGalleryIndex={vm.state.setGalleryIndex}
        setHoveredPhotoId={vm.state.setHoveredPhotoId}
        setShowArchivedPhotos={vm.state.setShowArchivedPhotos}
        showArchivedPhotos={vm.state.showArchivedPhotos}
        t={props.t}
        uploadPhoto={vm.actions.uploadPhoto}
        visiblePhotos={vm.data.visiblePhotos}
      />
      <ClientMeasurementHistory clientId={String(vm.query.data?.id ?? '')} t={props.t} />
    </>
  );
}

function ObjectivesCard(props: { labels: Labels; vm: Vm }): React.JSX.Element {
  const vm = props.vm;
  return (
    <View style={styles.card}>
      <ObjectiveSelect label={props.labels.primaryObjective} vm={vm} />
      <Text style={styles.label}>{props.labels.secondaryObjectives}</Text>
      <SecondaryChips labels={props.labels} vm={vm} />
    </View>
  );
}

function ObjectiveSelect(props: { label: string; vm: Vm }): React.JSX.Element {
  return (
    <Select
      label={props.label}
      onChange={(value) => setFormField(props.vm, 'objectiveId', value)}
      options={props.vm.data.objectiveOptions.map((item) => ({ label: item.label, value: item.id }))}
      value={props.vm.state.form.objectiveId}
    />
  );
}

function SecondaryChips(props: { labels: Labels; vm: Vm }): React.JSX.Element {
  const removeIcon = '×';
  return (
    <>
      <View style={styles.row}>
        {props.vm.data.secondaryObjectives.map((item) => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipLabel}>{item}</Text>
            <Pressable onPress={() => removeSecondaryObjective(props.vm, item)}>
              <Text style={styles.chipRemove}>{removeIcon}</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.row}>
        <TextField
          containerStyle={styles.flexInput}
          onChangeText={props.vm.state.setSecondaryInput}
          onSubmitEditing={() => addSecondaryObjective(props.vm)}
          placeholder={props.labels.secondaryPlaceholder}
          value={props.vm.state.secondaryInput}
        />
        <Button
          label={props.labels.addSecondaryObjective}
          onPress={() => addSecondaryObjective(props.vm)}
          variant={VARIANT_SECONDARY}
        />
      </View>
    </>
  );
}

function addSecondaryObjective(vm: Vm): void {
  const candidate = vm.state.secondaryInput.trim();
  if (!candidate || vm.data.secondaryObjectives.includes(candidate)) return;
  const next = [...vm.data.secondaryObjectives, candidate];
  setFormField(vm, 'secondaryObjectives', next.join(', '));
  vm.state.setSecondaryInput('');
}

function removeSecondaryObjective(vm: Vm, value: string): void {
  const next = vm.data.secondaryObjectives.filter((item) => item !== value);
  setFormField(vm, 'secondaryObjectives', next.join(', '));
}

function ProfileCard(props: { labels: Labels; t: Translate; vm: Vm }): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.labels.profileTitle}</Text>
      <ProfileFieldsSection
        errors={props.vm.state.errors}
        form={props.vm.state.form}
        includeAdvancedTextAreas={false}
        includeBirthDateField={false}
        includeBodyMetrics={false}
        includeFitnessField={false}
        includeObjectiveField={false}
        objectiveOptions={props.vm.data.objectiveOptions}
        onChange={(key, value) => onFieldChange(props.vm, key, value)}
        t={props.t}
      />
    </View>
  );
}

function onFieldChange(vm: Vm, key: string, value: string): void {
  vm.state.setErrors((prev) => ({ ...prev, [key]: undefined }));
  vm.state.setForm((prev) => ({ ...prev, [key]: value }));
}

function SideColumn(props: { labels: Labels; onArchived?: () => void; t: Translate; vm: Vm }): React.JSX.Element {
  const vm = props.vm;
  const stacked = useBreakpoint() !== 'lg';
  return (
    <View style={[styles.sideColumn, stacked && styles.stackedColumn]}>
      <FitnessCard labels={props.labels} t={props.t} vm={vm} />
      <HealthCards labels={props.labels} vm={vm} />
      <AccountCard labels={props.labels} onArchived={props.onArchived} t={props.t} vm={vm} />
    </View>
  );
}

function HealthCards(props: { labels: Labels; vm: Vm }): React.JSX.Element {
  return (
    <>
      <EditableBlockCard
        editable={Boolean(props.vm.state.editableSections.injuries)}
        icon={ICON_INJURY}
        label={props.labels.injuries}
        onChange={(value) => setFormField(props.vm, 'injuries', value)}
        onToggleEdit={() => toggleEditableSection(props.vm, 'injuries')}
        value={props.vm.state.form.injuries}
      />
      <EditableBlockCard
        editable={Boolean(props.vm.state.editableSections.allergies)}
        icon={ICON_ALERT}
        label={props.labels.allergies}
        onChange={(value) => setFormField(props.vm, 'allergies', value)}
        onToggleEdit={() => toggleEditableSection(props.vm, 'allergies')}
        value={props.vm.state.form.allergies}
      />
      <EditableBlockCard
        editable={Boolean(props.vm.state.editableSections.considerations)}
        icon={ICON_IDEA}
        label={props.labels.considerations}
        onChange={(value) => setFormField(props.vm, 'considerations', value)}
        onToggleEdit={() => toggleEditableSection(props.vm, 'considerations')}
        value={props.vm.state.form.considerations}
      />
    </>
  );
}

function FitnessCard(props: { labels: Labels; t: Translate; vm: Vm }): React.JSX.Element {
  const options = FITNESS_LEVELS.map((level) => ({
    label: props.t(`coach.clientProfile.fitness.${level.key}`),
    value: level.value,
  }));
  return (
    <View style={styles.card}>
      <Select
        label={props.labels.fitnessLevel}
        onChange={(value) => setFormField(props.vm, 'fitnessLevel', value)}
        options={options}
        value={props.vm.state.form.fitnessLevel}
      />
    </View>
  );
}

function setFormField(vm: Vm, field: string, value: string): void {
  vm.state.setForm((prev) => ({ ...prev, [field]: value }));
}

function toggleEditableSection(vm: Vm, key: EditableSectionKey): void {
  vm.state.setEditableSections((prev) => ({ ...prev, [key]: !prev[key] }));
}
