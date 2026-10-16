import React from 'react';
import type { User } from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@trainerpro/ui';
import { getSupabaseClient } from '../../data/supabase-client';
import { useCoachDraft } from '../../data/hooks/useCoachDraft';
import { stableDraftValue } from '../../data/coach-draft-policy';
import { useCoachSaveGuard } from './useCoachSaveGuard';
import { CoachButton, CoachConflict, CoachField } from './CoachUi';

function accountFields(user: User) {
  return {
    firstName: String(user.user_metadata?.firstName ?? ''),
    lastName: String(user.user_metadata?.lastName ?? ''),
    avatarUrl: String(user.user_metadata?.avatarUrl ?? ''),
    email: user.email ?? '',
  };
}
export function CoachAccountForm({ user, onSaved }: { user: User; onSaved: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const initial = accountFields(user);
  const draft = useCoachDraft('account-profile', initial, stableDraftValue(initial));
  const guard = useCoachSaveGuard();
  const save = useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: async () => {
      const { email, ...data } = draft.value;
      const result = await getSupabaseClient().auth.updateUser({ ...(email !== user.email ? { email } : {}), data });
      if (result.error) throw result.error;
      await draft.clear();
      toast.success(t(email !== user.email ? 'coachWorkspace.accountEmailConfirmation' : 'coachWorkspace.saved'));
      onSaved();
    },
  });
  const persist = () =>
    guard.run(
      initial,
      async () => {
        const result = await getSupabaseClient().auth.getUser();
        if (result.error) throw result.error;
        return result.data.user?.id === user.id ? accountFields(result.data.user) : undefined;
      },
      async () => {
        await save.mutateAsync();
      },
    );
  return (
    <>
      <CoachConflict conflict={draft.conflict || guard.conflict} onDiscard={() => void draft.clear().then(onSaved)} />
      {(Object.keys(initial) as (keyof typeof initial)[]).map((key) => (
        <CoachField
          key={key}
          label={t('coachWorkspace.field.' + key)}
          value={draft.value[key]}
          onChange={(value) => draft.setValue((old) => ({ ...old, [key]: value }))}
        />
      ))}
      <CoachButton
        label={t('coachWorkspace.save')}
        loading={save.isPending || guard.busy}
        disabled={!draft.ready || draft.conflict || guard.conflict || !/^\S+@\S+\.\S+$/.test(draft.value.email)}
        onPress={() => void persist()}
      />
    </>
  );
}
