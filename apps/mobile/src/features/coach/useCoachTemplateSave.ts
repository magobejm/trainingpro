import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@trainerpro/ui';
import { coachRoutineSchema, coachWarmupSchema, normalizeCoachRoutine } from '@trainerpro/shared';
import { useCoachWrite } from '../../data/hooks/useCoachData';
import type { useCoachDraft } from '../../data/hooks/useCoachDraft';
import type { PlanRecord } from './coach-plan-model';
import {
  prepareCoachTemplateSaves,
  saveCoachTemplate,
  canResumeTemplatePublication,
  type TemplateSaveStates,
} from './coach-template-save';

export function useCoachTemplateSave({
  kind,
  draft,
  template,
  copy = false,
  clientId,
  onBack,
}: {
  kind: 'routines' | 'warmups';
  draft: ReturnType<typeof useCoachDraft<PlanRecord>>;
  template?: PlanRecord;
  copy?: boolean;
  clientId?: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const mutation = useCoachWrite<PlanRecord>();
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const stored = draft.value.templateSaves as TemplateSaveStates | undefined;
  const saveBlocked = draft.conflict && !copy && !canResumeTemplatePublication(stored?.edit, template);
  const save = async () => {
    if (locked.current || !draft.ready || saveBlocked) return;
    locked.current = true;
    setBusy(true);
    try {
      const mode = copy ? 'copy' : 'edit';
      const states = prepareCoachTemplateSaves(draft.value);
      const parsed =
        kind === 'routines'
          ? coachRoutineSchema.safeParse(normalizeCoachRoutine(draft.value))
          : coachWarmupSchema.safeParse(draft.value);
      if (!parsed.success) {
        toast.error(
          t('coachWorkspace.invalidPlan') + ': ' + parsed.error.issues.map((issue) => issue.path.join(' · ')).join(', '),
        );
        return;
      }
      let expected = { ...draft.value, templateSaves: states };
      await saveCoachTemplate(
        {
          kind,
          payload: parsed.data,
          progress: states[mode],
          clientId,
          originalId: !copy && template?.id ? String(template.id) : undefined,
          originalVersion: !copy && template?.templateVersion ? Number(template.templateVersion) : undefined,
        },
        mutation.mutateAsync,
        async (progress) => {
          expected = { ...expected, templateSaves: { ...states, [mode]: progress } };
          await draft.persistValue((current) => ({
            ...current,
            templateSaves: { ...states, ...((current.templateSaves as object) ?? {}), [mode]: progress },
          }));
        },
      );
      await draft.clear(expected);
      onBack();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('coachWorkspace.saveError'));
      throw error;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return { save, saveBlocked, write: { isPending: busy || mutation.isPending } };
}
