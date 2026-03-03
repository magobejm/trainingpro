import React from 'react';
import { FilterChips, SearchBar } from '@trainerpro/ui';
import { DimensionValue, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import type { ExerciseLibraryItem } from '../../../data/hooks/useLibraryQuery';
import type { ExerciseCreateFormState } from '../LibraryExercisesScreen.create';
import { libraryStyles as styles } from '../library-screen.styles';
import { ExerciseLibraryCard } from './ExerciseLibraryCard';
import { ExerciseBaseFields } from './LibraryCreateFormFields';
import { LibraryCreateModal } from './LibraryCreateModal';
import { LibraryMediaFields } from './LibraryMediaFields';
import { LibraryItemDetailModal } from './LibraryItemDetailModal';

type Props = {
  activeFilter: string;
  chips: Array<{ id: string; label: string }>;
  createError: string;
  createForm: ExerciseCreateFormState;
  createModalVisible: boolean;
  createSubmitting: boolean;
  createUploading: boolean;
  deleteError: string;
  deletingId: string;
  editError: string;
  editForm: ExerciseCreateFormState;
  editModalVisible: boolean;
  editSubmitting: boolean;
  editUploading: boolean;
  expandedId: string;
  items: ExerciseLibraryItem[];
  muscleGroupOptions: Array<{ id: string; label: string }>;
  query: string;
  onCloseCreateModal: () => void;
  onCloseEditModal: () => void;
  onCreate: () => void;
  onDelete: (itemId: string) => void;
  onEdit: (item: ExerciseLibraryItem) => void;
  onSaveEdit: () => void;
  onOpenCreateModal: () => void;
  onSelectFilter: (id: string) => void;
  onSetCreateField: (field: string) => (value: string) => void;
  onSetEditField: (field: string) => (value: string) => void;
  onToggleDetail: (itemId: string) => void;
  onUploadCreateImage: () => void;
  onUploadEditImage: () => void;
  setQuery: (value: string) => void;
  t: (key: string) => string;
};

export function LibraryExercisesView(props: Props): React.JSX.Element {
  const expandedItem = props.items.find((i) => i.id === props.expandedId) || null;

  return (
    <View style={styles.page}>
      <TopBar {...props} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.filtersWrapper}>
          <FilterChips
            activeId={props.activeFilter}
            items={props.chips}
            onSelect={props.onSelectFilter}
          />
        </View>
        {renderList(props)}
      </ScrollView>
      <CreateModal {...props} />
      <EditModal {...props} />
      <LibraryItemDetailModal
        item={expandedItem}
        onClose={() => props.onToggleDetail(props.expandedId)}
        t={props.t}
        // eslint-disable-next-line no-restricted-syntax
        type="strength"
      />
    </View>
  );
}

function TopBar(props: Props): React.JSX.Element {
  return (
    <View style={topBarStyles.container}>
      <Text style={topBarStyles.title}>{props.t('coach.library.exercises.title')}</Text>
      <View style={topBarStyles.actions}>
        <View style={topBarStyles.searchWrapper}>
          <SearchBar
            onChangeText={props.setQuery}
            placeholder={props.t('coach.library.exercises.searchPlaceholder')}
            value={props.query}
          />
        </View>
        <Pressable onPress={props.onOpenCreateModal} style={topBarStyles.createBtn}>
          <Text style={topBarStyles.createBtnText}>{props.t('coach.library.actions.create')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const topBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchWrapper: {
    width: 320,
  },
  createBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

function CreateModal(props: Props): React.JSX.Element {
  return (
    <LibraryCreateModal
      cancelLabel={props.t('coach.clients.modal.cancel')}
      errorContent={renderError(props.createError, props.t)}
      formContent={<ExerciseBaseFields {...buildBaseProps(props, true)} />}
      isSubmitting={props.createSubmitting}
      mediaContent={renderMedia(props, true)}
      onClose={props.onCloseCreateModal}
      onSubmit={props.onCreate}
      submitLabel={props.t('coach.library.actions.create')}
      submittingLabel={props.t('coach.library.exercises.modal.creating')}
      title={props.t('coach.library.exercises.modal.title')}
      visible={props.createModalVisible}
    />
  );
}

function EditModal(props: Props): React.JSX.Element {
  return (
    <LibraryCreateModal
      cancelLabel={props.t('coach.clients.modal.cancel')}
      errorContent={renderError(props.editError, props.t)}
      formContent={<ExerciseBaseFields {...buildBaseProps(props, false)} />}
      isSubmitting={props.editSubmitting}
      mediaContent={renderMedia(props, false)}
      onClose={props.onCloseEditModal}
      onSubmit={props.onSaveEdit}
      submitLabel={props.t('coach.library.exercises.editModal.save')}
      submittingLabel={props.t('coach.library.exercises.editModal.saving')}
      title={props.t('coach.library.exercises.editModal.title')}
      visible={props.editModalVisible}
    />
  );
}

function renderList(props: Props): React.JSX.Element {
  if (props.items.length === 0) {
    return <Text style={styles.empty}>{props.t('coach.library.empty')}</Text>;
  }
  return (
    <View style={gridStyles.grid}>
      {props.deleteError ? <Text style={styles.error}>{props.deleteError}</Text> : null}
      {props.items.map((item) => (
        <View key={item.id} style={gridStyles.gridItem}>
          <ExerciseLibraryCard
            deleting={props.deletingId === item.id}
            item={item}
            onDelete={() => props.onDelete(item.id)}
            onEdit={() => props.onEdit(item)}
            onPress={() => props.onToggleDetail(item.id)}
            t={props.t}
          />
        </View>
      ))}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    width: '100%' as DimensionValue,
  },
  gridItem: {
    width: 340,
  },
});

function buildBaseProps(props: Props, createMode: boolean) {
  return {
    form: createMode ? props.createForm : props.editForm,
    muscleGroupOptions: props.muscleGroupOptions,
    setField: createMode ? props.onSetCreateField : props.onSetEditField,
    t: props.t,
  };
}

function renderMedia(props: Props, createMode: boolean): React.JSX.Element {
  const form = createMode ? props.createForm : props.editForm;
  const setField = createMode ? props.onSetCreateField : props.onSetEditField;
  return (
    <LibraryMediaFields
      // eslint-disable-next-line no-restricted-syntax
      category="strength"
      imageUrl={form.imageUrl}
      isUploading={createMode ? props.createUploading : props.editUploading}
      onRemoveImage={() => setField('imageUrl')('')}
      onUpload={createMode ? props.onUploadCreateImage : props.onUploadEditImage}
      setYoutubeUrl={setField('youtubeUrl')}
      t={props.t}
      youtubeUrl={form.youtubeUrl}
    />
  );
}

function renderError(message: string, t: Props['t']) {
  return message ? <Text style={styles.error}>{t(message)}</Text> : null;
}
