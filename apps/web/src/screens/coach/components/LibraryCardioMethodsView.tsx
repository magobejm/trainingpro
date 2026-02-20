import React from 'react';
import { FilterChips, SearchBar } from '@trainerpro/ui';
import { ScrollView, Text, View } from 'react-native';
import type { CardioMethodLibraryItem } from '../../../data/hooks/useLibraryQuery';
import { libraryStyles as styles } from '../library-screen.styles';
import { CardioMethodLibraryRow } from './CardioMethodLibraryRow';
import { CardioBaseFields } from './LibraryCreateFormFields';
import { LibraryCreateCta } from './LibraryCreateCta';
import { LibraryCreateModal } from './LibraryCreateModal';
import { LibraryMediaFields } from './LibraryMediaFields';

type FormState = {
  description: string;
  imageUrl: string;
  methodTypeId: string;
  name: string;
  youtubeUrl: string;
};

type Props = {
  activeFilter: string;
  chips: Array<{ id: string; label: string }>;
  createError: string;
  createForm: FormState;
  createModalVisible: boolean;
  createSubmitting: boolean;
  createUploading: boolean;
  deleteError: string;
  deletingId: string;
  editError: string;
  editForm: FormState;
  editModalVisible: boolean;
  editSubmitting: boolean;
  editUploading: boolean;
  expandedId: string;
  items: CardioMethodLibraryItem[];
  methodTypeOptions: Array<{ id: string; label: string }>;
  query: string;
  onCloseCreateModal: () => void;
  onCloseEditModal: () => void;
  onCreate: () => void;
  onDelete: (itemId: string) => void;
  onEdit: (item: CardioMethodLibraryItem) => void;
  onOpenCreateModal: () => void;
  onSaveEdit: () => void;
  onSelectFilter: (id: string) => void;
  onSetCreateField: (field: string) => (value: string) => void;
  onSetEditField: (field: string) => (value: string) => void;
  onToggleDetail: (itemId: string) => void;
  onUploadCreateImage: () => void;
  onUploadEditImage: () => void;
  setQuery: (value: string) => void;
  t: (key: string) => string;
};

export function LibraryCardioMethodsView(props: Props): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{props.t('coach.library.cardio.title')}</Text>
      <Text style={styles.subtitle}>{props.t('coach.library.cardio.subtitle')}</Text>
      <SearchCard {...props} />
      <CreateCta {...props} />
      <CreateModal {...props} />
      <EditModal {...props} />
      <View style={styles.card}>{renderList(props)}</View>
    </ScrollView>
  );
}

function SearchCard(props: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      <SearchBar
        onChangeText={props.setQuery}
        placeholder={props.t('coach.library.cardio.searchPlaceholder')}
        value={props.query}
      />
      <FilterChips
        activeId={props.activeFilter}
        items={props.chips}
        onSelect={props.onSelectFilter}
      />
    </View>
  );
}

function CreateCta(props: Props): React.JSX.Element {
  return (
    <LibraryCreateCta
      buttonLabel={props.t('coach.library.actions.create')}
      onPress={props.onOpenCreateModal}
      subtitle={props.t('coach.library.cardio.cta.subtitle')}
      title={props.t('coach.library.cardio.cta.title')}
    />
  );
}

function CreateModal(props: Props): React.JSX.Element {
  return (
    <LibraryCreateModal
      cancelLabel={props.t('coach.clients.modal.cancel')}
      isSubmitting={props.createSubmitting}
      onClose={props.onCloseCreateModal}
      onSubmit={props.onCreate}
      submitLabel={props.t('coach.library.actions.create')}
      submittingLabel={props.t('coach.library.cardio.modal.creating')}
      subtitle={props.t('coach.library.cardio.modal.subtitle')}
      title={props.t('coach.library.cardio.modal.title')}
      visible={props.createModalVisible}
    >
      <CardioBaseFields {...buildBaseProps(props, true)} />
      {renderMedia(props, true)}
      {renderError(props.createError, props.t)}
    </LibraryCreateModal>
  );
}

function EditModal(props: Props): React.JSX.Element {
  return (
    <LibraryCreateModal
      cancelLabel={props.t('coach.clients.modal.cancel')}
      isSubmitting={props.editSubmitting}
      onClose={props.onCloseEditModal}
      onSubmit={props.onSaveEdit}
      submitLabel={props.t('coach.library.exercises.editModal.save')}
      submittingLabel={props.t('coach.library.exercises.editModal.saving')}
      subtitle={props.t('coach.library.exercises.editModal.subtitle')}
      title={props.t('coach.library.exercises.editModal.title')}
      visible={props.editModalVisible}
    >
      <CardioBaseFields {...buildBaseProps(props, false)} />
      {renderMedia(props, false)}
      {renderError(props.editError, props.t)}
    </LibraryCreateModal>
  );
}

function renderList(props: Props): React.JSX.Element {
  if (props.items.length === 0) {
    return <Text style={styles.empty}>{props.t('coach.library.empty')}</Text>;
  }
  return (
    <View style={styles.list}>
      {props.deleteError ? <Text style={styles.error}>{props.deleteError}</Text> : null}
      {props.items.map((item) => (
        <CardioMethodLibraryRow
          deleting={props.deletingId === item.id}
          expanded={props.expandedId === item.id}
          item={item}
          key={item.id}
          onDelete={() => props.onDelete(item.id)}
          onEdit={() => props.onEdit(item)}
          onToggle={() => props.onToggleDetail(item.id)}
          t={props.t}
        />
      ))}
    </View>
  );
}

function buildBaseProps(props: Props, createMode: boolean) {
  return {
    form: createMode ? props.createForm : props.editForm,
    methodTypeOptions: props.methodTypeOptions,
    setField: createMode ? props.onSetCreateField : props.onSetEditField,
    t: props.t,
  };
}

function renderMedia(props: Props, createMode: boolean): React.JSX.Element {
  const form = createMode ? props.createForm : props.editForm;
  return (
    <LibraryMediaFields
      imageUrl={form.imageUrl}
      isUploading={createMode ? props.createUploading : props.editUploading}
      onUpload={createMode ? props.onUploadCreateImage : props.onUploadEditImage}
      setYoutubeUrl={(createMode ? props.onSetCreateField : props.onSetEditField)('youtubeUrl')}
      t={props.t}
      youtubeUrl={form.youtubeUrl}
    />
  );
}

function renderError(message: string, t: Props['t']) {
  return message ? <Text style={styles.error}>{t(message)}</Text> : null;
}
