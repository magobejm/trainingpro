import type { ClientForm } from './client-profile.form';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export type Labels = ReturnType<typeof buildLabels>;

export function buildLabels(t: Translate, form: ClientForm) {
  void form;
  return {
    ...buildMainLabels(t),
    progress: buildProgressLabels(t),
    tempPasswordLine: (value: string) =>
      t('coach.clientProfile.resetPassword.line', {
        label: t('coach.clientProfile.resetPassword.value'),
        value,
      }),
  };
}

function buildMainLabels(t: Translate) {
  return {
    activeSince: t('coach.clientProfile.editPage.activeSince', { month: '' }).replace(/\s*$/, ''),
    accountTitle: t('coach.clientProfile.editPage.accountTitle'),
    addSecondaryObjective: t('coach.clientProfile.editPage.addSecondaryObjective'),
    age: t('coach.clientProfile.stats.age'),
    allergies: t('coach.clientProfile.editPage.allergies'),
    archiveClient: t('coach.clientProfile.archive'),
    back: t('coach.clientProfile.editPage.backToProfile'),
    considerations: t('coach.clientProfile.editPage.considerations'),
    fcMax: t('coach.clientProfile.stats.fcMax'),
    fcRest: t('coach.clientProfile.stats.fcRest'),
    fitnessLevel: t('coach.clientProfile.editPage.fitnessLevel'),
    height: t('coach.clientProfile.stats.height'),
    hip: t('coach.clientProfile.stats.hip'),
    injuries: t('coach.clientProfile.editPage.injuries'),
    notes: t('coach.clientProfile.editPage.notes'),
    primaryObjective: t('coach.clientProfile.editPage.primaryObjective'),
    profileTitle: t('coach.clientProfile.editPage.title'),
    resetPassword: t('coach.clientProfile.resetPassword.action'),
    save: t('coach.clientProfile.editPage.save'),
    saving: t('coach.clientProfile.editPage.saving'),
    secondaryObjectives: t('coach.clientProfile.editPage.secondaryObjectives'),
    secondaryPlaceholder: t('coach.clientProfile.editPage.secondaryObjectivePlaceholder'),
    waist: t('coach.clientProfile.stats.waist'),
    weight: t('coach.clientProfile.stats.weight'),
  };
}

function buildProgressLabels(t: Translate) {
  return {
    archived: t('coach.clientProfile.editPage.progressPhotosArchived'),
    archivedEmpty: t('coach.clientProfile.editPage.archivedPhotosEmpty'),
    archivedHint: t('coach.clientProfile.editPage.archivedPhotosHint'),
    archivedTitle: t('coach.clientProfile.editPage.archivedPhotosTitle'),
    openGalleryHint: t('coach.clientProfile.editPage.openGalleryHint'),
    progressPhotos: t('coach.clientProfile.editPage.progressPhotos'),
    restore: t('coach.clientProfile.editPage.restorePhoto'),
    visible: t('coach.clientProfile.editPage.progressPhotosVisible'),
  };
}
