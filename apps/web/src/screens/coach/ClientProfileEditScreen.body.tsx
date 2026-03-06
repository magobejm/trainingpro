import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { styles } from './ClientProfileEditScreen.styles';
import { ProfileFieldsSection } from './components/EditClientProfileModal.fields';
import { EditableBlockCard } from './ClientProfileEditScreen.components';
import { ProgressPhotosPanel } from './ClientProfileEditScreen.progress';
import type { Labels } from './ClientProfileEditScreen.labels';
import type { useClientProfileEditState } from './ClientProfileEditScreen.hooks';
import { ICON_ALERT, ICON_IDEA, ICON_INJURY, ICON_NOTE } from './ClientProfileEditScreen.utils';

type Vm = ReturnType<typeof useClientProfileEditState>;
type Translate = (key: string, options?: Record<string, unknown>) => string;
type EditableSectionKey = 'allergies' | 'considerations' | 'injuries' | 'notes';

export function MainLayout(props: {
  labels: Labels;
  onArchived?: () => void;
  t: Translate;
  vm: Vm;
}): React.JSX.Element {
  return (
    <View style={styles.mainLayout}>
      <MainColumn labels={props.labels} t={props.t} vm={props.vm} />
      <SideColumn labels={props.labels} onArchived={props.onArchived} t={props.t} vm={props.vm} />
    </View>
  );
}

function MainColumn(props: { labels: Labels; t: Translate; vm: Vm }): React.JSX.Element {
  const vm = props.vm;
  return (
    <View style={styles.mainColumn}>
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
  );
}

function ObjectivesCard(props: { labels: Labels; vm: Vm }): React.JSX.Element {
  const vm = props.vm;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.labels.primaryObjective}</Text>
      <ObjectiveSelect vm={vm} />
      <Text style={styles.label}>{props.labels.secondaryObjectives}</Text>
      <SecondaryChips labels={props.labels} vm={vm} />
    </View>
  );
}

function ObjectiveSelect(props: { vm: Vm }): React.JSX.Element {
  return (
    <select
      onChange={(event) => setFormField(props.vm, 'objectiveId', event.target.value)}
      style={styles.selectInput}
      value={props.vm.state.form.objectiveId}
    >
      {props.vm.data.objectiveOptions.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </select>
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
        <TextInput
          onChangeText={props.vm.state.setSecondaryInput}
          placeholder={props.labels.secondaryPlaceholder}
          style={[styles.input, styles.flexInput]}
          value={props.vm.state.secondaryInput}
        />
        <Pressable onPress={() => addSecondaryObjective(props.vm)} style={styles.secondaryButton}>
          <Text style={styles.secondaryLabel}>{props.labels.addSecondaryObjective}</Text>
        </Pressable>
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

function SideColumn(props: {
  labels: Labels;
  onArchived?: () => void;
  t: Translate;
  vm: Vm;
}): React.JSX.Element {
  const vm = props.vm;
  return (
    <View style={styles.sideColumn}>
      <FitnessCard labels={props.labels} t={props.t} vm={vm} />
      <HealthCards labels={props.labels} vm={vm} />
      <AccountCard labels={props.labels} onArchived={props.onArchived} vm={vm} />
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
  const emptyLevel = '';
  const beginnerLevel = 'beginner';
  const intermediateLevel = 'intermediate';
  const advancedLevel = 'advanced';
  const eliteLevel = 'elite';
  return (
    <View style={styles.card}>
      <View style={styles.blockHeader}>
        <Text style={styles.label}>{props.labels.fitnessLevel}</Text>
      </View>
      <select
        onChange={(event) => setFormField(props.vm, 'fitnessLevel', event.target.value)}
        style={styles.selectInput}
        value={props.vm.state.form.fitnessLevel}
      >
        <option value={emptyLevel}>{props.t('coach.clientProfile.fitness.unspecified')}</option>
        <option value={beginnerLevel}>{props.t('coach.clientProfile.fitness.beginner')}</option>
        <option value={intermediateLevel}>
          {props.t('coach.clientProfile.fitness.intermediate')}
        </option>
        <option value={advancedLevel}>{props.t('coach.clientProfile.fitness.advanced')}</option>
        <option value={eliteLevel}>{props.t('coach.clientProfile.fitness.elite')}</option>
      </select>
    </View>
  );
}

function AccountCard(props: {
  labels: Labels;
  onArchived?: () => void;
  vm: Vm;
}): React.JSX.Element {
  const vm = props.vm;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.labels.accountTitle}</Text>
      <View style={styles.row}>
        <Pressable onPress={() => void resetPassword(vm)} style={styles.secondaryButton}>
          <Text style={styles.secondaryLabel}>{props.labels.resetPassword}</Text>
        </Pressable>
        <Pressable
          onPress={() => void vm.actions.archiveClient().then(() => props.onArchived?.())}
          style={styles.dangerButton}
        >
          <Text style={styles.dangerLabel}>{props.labels.archiveClient}</Text>
        </Pressable>
      </View>
      {vm.state.tempPassword ? (
        <Text style={styles.helperText}>
          {props.labels.tempPasswordLine(vm.state.tempPassword)}
        </Text>
      ) : null}
    </View>
  );
}

function resetPassword(vm: Vm): Promise<void> {
  return vm.actions.resetPassword().then((result) => {
    vm.state.setTempPassword((result as { temporaryPassword: string }).temporaryPassword);
  }) as Promise<void>;
}

function setFormField(vm: Vm, field: string, value: string): void {
  vm.state.setForm((prev) => ({ ...prev, [field]: value }));
}

function toggleEditableSection(vm: Vm, key: EditableSectionKey): void {
  vm.state.setEditableSections((prev) => ({ ...prev, [key]: !prev[key] }));
}
