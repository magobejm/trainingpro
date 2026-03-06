import { useEffect, useRef, useState } from 'react';
import {
  useArchiveClientMutation,
  useArchiveClientProgressPhotoMutation,
  useResetClientPasswordMutation,
  useRestoreClientProgressPhotoMutation,
  useUpdateClientMutation,
  useUploadClientAvatarMutation,
  useUploadClientProgressPhotoMutation,
} from '../../data/hooks/useClientMutations';
import { useClientByIdQuery, useClientObjectivesQuery } from '../../data/hooks/useClientsQuery';
import { listAvailableAvatarUrls } from '../../data/avatar-default';
import { emptyForm, toForm, type ClientForm } from './client-profile.form';
import type { FormErrors } from './client-profile.validation';
import {
  calculateAge,
  daysSince,
  formatDateDisplay,
  formatMonthYear,
  type ProgressPhoto,
} from './ClientProfileEditScreen.utils';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function useClientProfileEditState(clientId: string, locale: string, t: Translate) {
  const query = useClientByIdQuery(clientId);
  const objectivesQuery = useClientObjectivesQuery();
  const mutations = useMutations(clientId);
  const state = useRawState(query.data);
  const refs = useRefs();
  cleanupBlobOnUnmount(state.pendingAvatarPreviewUrl);
  const data = deriveViewData(
    query.data,
    objectivesQuery.data,
    state.form,
    state.galleryIndex,
    locale,
    t,
  );
  const actions = createActions(mutations, query.data?.id ?? '');
  return { actions, data, query, refs, state };
}

function useMutations(clientId: string) {
  return {
    archiveMutation: useArchiveClientMutation(),
    archivePhotoMutation: useArchiveClientProgressPhotoMutation(clientId),
    resetPasswordMutation: useResetClientPasswordMutation(),
    restorePhotoMutation: useRestoreClientProgressPhotoMutation(clientId),
    updateMutation: useUpdateClientMutation(clientId),
    uploadAvatarMutation: useUploadClientAvatarMutation(clientId),
    uploadPhotoMutation: useUploadClientProgressPhotoMutation(clientId),
  };
}

function useRawState(queryData?: Record<string, unknown>) {
  const base = useBaseState();
  const visual = useVisualState();
  hydrateFormFromQuery(queryData, base.setForm, base.setErrors);
  return { ...base, ...visual };
}

function useBaseState() {
  const [form, setForm] = useState<ClientForm>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [secondaryInput, setSecondaryInput] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreviewUrl, setPendingAvatarPreviewUrl] = useState('');
  return {
    errors,
    form,
    pendingAvatarFile,
    pendingAvatarPreviewUrl,
    secondaryInput,
    setErrors,
    setForm,
    setPendingAvatarFile,
    setPendingAvatarPreviewUrl,
    setSecondaryInput,
    setTempPassword,
    tempPassword,
  };
}

function useVisualState() {
  const [draggedPhotoId, setDraggedPhotoId] = useState('');
  const [editableBirthDate, setEditableBirthDate] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState<null | number>(null);
  const [hoveredPhotoId, setHoveredPhotoId] = useState('');
  const [hoveredAvatar, setHoveredAvatar] = useState(false);
  const [showArchivedPhotos, setShowArchivedPhotos] = useState(false);
  const [editableMetrics, setEditableMetrics] = useState(initialEditableMetrics);
  const [editableSections, setEditableSections] = useState(initialEditableSections);
  return {
    draggedPhotoId,
    editableBirthDate,
    editableMetrics,
    editableSections,
    galleryIndex,
    hoveredAvatar,
    hoveredPhotoId,
    setDraggedPhotoId,
    setEditableBirthDate,
    setEditableMetrics,
    setEditableSections,
    setGalleryIndex,
    setHoveredAvatar,
    setHoveredPhotoId,
    setShowArchivedPhotos,
    showArchivedPhotos,
  };
}

function hydrateFormFromQuery(
  queryData: Record<string, unknown> | undefined,
  setForm: React.Dispatch<React.SetStateAction<ClientForm>>,
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>,
): void {
  useEffect(() => {
    if (!queryData) return;
    setForm(toForm(queryData as never));
    setErrors({});
  }, [queryData, setErrors, setForm]);
}

function cleanupBlobOnUnmount(previewUrl: string): void {
  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
}

function useRefs() {
  const avatarRailRef = useRef<HTMLDivElement | null>(null);
  const photoRailRef = useRef<HTMLDivElement | null>(null);
  return { avatarRailRef, photoRailRef };
}

function deriveViewData(
  queryData: Record<string, unknown> | undefined,
  objectiveSource: Array<{ id: string; label: string }> | undefined,
  form: ClientForm,
  galleryIndex: null | number,
  locale: string,
  t: Translate,
) {
  const photos = derivePhotoLists(queryData?.progressPhotos);
  const days = daysSince(String(queryData?.updatedAt ?? ''));
  return {
    activeSince: getActiveSinceLabel(queryData, locale, t),
    age: calculateAge(form.birthDate),
    archivedPhotos: photos.archivedPhotos,
    avatarChoices: listAvailableAvatarUrls(),
    birthDateLabel: formatDateDisplay(
      form.birthDate,
      locale,
      t('coach.clientProfile.editPage.noDate'),
    ),
    effectiveGalleryIndex: getEffectiveGalleryIndex(galleryIndex, photos.visiblePhotos.length),
    fullName: getFullName(queryData),
    lastSessionLabel: getLastSessionLabel(days, t),
    objectiveOptions: getObjectiveOptions(queryData, objectiveSource),
    progressPhotos: photos.progressPhotos,
    secondaryObjectives: parseSecondaryObjectives(form.secondaryObjectives),
    visiblePhotos: photos.visiblePhotos,
  };
}

function derivePhotoLists(value: unknown) {
  const progressPhotos = normalizePhotos(value);
  return {
    archivedPhotos: progressPhotos.filter((item) => item.archived),
    progressPhotos,
    visiblePhotos: progressPhotos.filter((item) => !item.archived),
  };
}

function getActiveSinceLabel(
  queryData: Record<string, unknown> | undefined,
  locale: string,
  t: Translate,
): string {
  return formatMonthYear(
    String(queryData?.createdAt ?? ''),
    locale,
    t('coach.clientProfile.editPage.dateUnavailable'),
  );
}

function getLastSessionLabel(days: number, t: Translate): string {
  return days === 0
    ? t('coach.clientProfile.editPage.noSessions')
    : t('coach.clientProfile.editPage.lastSessionDays', { days });
}

function getFullName(queryData: Record<string, unknown> | undefined): string {
  return `${queryData?.firstName ?? ''} ${queryData?.lastName ?? ''}`.trim();
}

function getEffectiveGalleryIndex(
  galleryIndex: null | number,
  totalVisible: number,
): null | number {
  if (galleryIndex === null) return null;
  return Math.min(galleryIndex, Math.max(totalVisible - 1, 0));
}

function normalizePhotos(value: unknown): ProgressPhoto[] {
  return Array.isArray(value) ? (value as ProgressPhoto[]) : [];
}

function getObjectiveOptions(
  queryData: Record<string, unknown> | undefined,
  objectiveSource: Array<{ id: string; label: string }> | undefined,
): Array<{ id: string; label: string }> {
  const fromQuery = queryData?.objectiveOptions;
  if (Array.isArray(fromQuery) && fromQuery.length > 0) {
    return fromQuery as Array<{ id: string; label: string }>;
  }
  return objectiveSource ?? [];
}

function parseSecondaryObjectives(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function createActions(mutations: ReturnType<typeof useMutations>, queryId: string) {
  return {
    archiveClient: () => mutations.archiveMutation.mutateAsync(queryId),
    archivePhoto: (photoId: string) => mutations.archivePhotoMutation.mutateAsync(photoId),
    resetPassword: () => mutations.resetPasswordMutation.mutateAsync(queryId),
    restorePhoto: (photoId: string) => mutations.restorePhotoMutation.mutateAsync(photoId),
    saveClient: mutations.updateMutation.mutateAsync,
    uploadAvatar: (file: File) => mutations.uploadAvatarMutation.mutateAsync(file),
    uploadPhoto: (file: File) => mutations.uploadPhotoMutation.mutateAsync(file),
  };
}

const initialEditableMetrics = {
  fcMax: false,
  fcRest: false,
  heightCm: false,
  hipCm: false,
  waistCm: false,
  weightKg: false,
};

const initialEditableSections = {
  allergies: false,
  considerations: false,
  injuries: false,
  notes: false,
};
