import { useEffect, useState } from 'react';
import {
  useCreateClientMutation,
  useResetClientPasswordMutation,
  type CreateClientResult,
} from '../../data/hooks/useClientMutations';
import { listAvailableAvatarUrls } from '../../data/avatar-default';

type CreateMutation = ReturnType<typeof useCreateClientMutation>;
type ResetMutation = ReturnType<typeof useResetClientPasswordMutation>;

type FormState = {
  availableAvatars: string[];
  avatarUrl: string;
  confirmEmail: string;
  email: string;
  emailMismatch: boolean;
  firstName: string;
  lastName: string;
  modalVisible: boolean;
  objectiveId: string;
  result: CreateClientResult | null;
  setConfirmEmail: (value: string) => void;
  setAvatarUrl: (value: string) => void;
  setEmail: (value: string) => void;
  setEmailMismatch: (value: boolean) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setModalVisible: (value: boolean) => void;
  setObjectiveId: (value: string) => void;
  setResult: (value: CreateClientResult | null) => void;
};

export function useClientCreateForm(
  createMutation: CreateMutation,
  objectiveOptions: Array<{ id: string }>,
) {
  const resetPasswordMutation = useResetClientPasswordMutation();
  const state = useFormState(objectiveOptions);
  const actions = createFormActions(createMutation, resetPasswordMutation, state);
  return {
    ...actions,
    ...state,
    isCreating: createMutation.isPending,
    isFormValid: !state.emailMismatch && hasRequiredFields(state),
    isResettingPassword: resetPasswordMutation.isPending,
  };
}

function useFormState(objectiveOptions: Array<{ id: string }>): FormState {
  const emailState = useEmailState();
  const nameState = useNameState();
  const avatarState = useAvatarState();
  const objectiveState = useObjectiveState(objectiveOptions);
  const modalState = useModalResultState();
  useSyncEmailMismatch(emailState);
  return { ...avatarState, ...emailState, ...nameState, ...objectiveState, ...modalState };
}

function useEmailState() {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [email, setEmail] = useState('');
  const [emailMismatch, setEmailMismatch] = useState(false);
  return { confirmEmail, email, emailMismatch, setConfirmEmail, setEmail, setEmailMismatch };
}

function useSyncEmailMismatch(state: {
  confirmEmail: string;
  email: string;
  setEmailMismatch: (value: boolean) => void;
}): void {
  useEffect(() => {
    const hasBoth = state.email.trim().length > 0 && state.confirmEmail.trim().length > 0;
    state.setEmailMismatch(hasBoth && !emailsMatch(state.email, state.confirmEmail));
  }, [state.confirmEmail, state.email, state.setEmailMismatch]);
}

function useNameState() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  return { firstName, lastName, setFirstName, setLastName };
}

function useAvatarState() {
  const availableAvatars = listAvailableAvatarUrls();
  const [avatarUrl, setAvatarUrl] = useState(availableAvatars[0] ?? '');
  return { availableAvatars, avatarUrl, setAvatarUrl };
}

function useObjectiveState(objectiveOptions: Array<{ id: string }>) {
  const defaultObjectiveId = objectiveOptions[0]?.id ?? '';
  const [objectiveId, setObjectiveId] = useState(defaultObjectiveId);
  useEffect(() => {
    if (!objectiveId && defaultObjectiveId) {
      setObjectiveId(defaultObjectiveId);
    }
  }, [defaultObjectiveId, objectiveId]);
  return { objectiveId, setObjectiveId };
}

function useModalResultState() {
  const [modalVisible, setModalVisible] = useState(false);
  const [result, setResult] = useState<CreateClientResult | null>(null);
  return { modalVisible, result, setModalVisible, setResult };
}

function createFormActions(
  createMutation: CreateMutation,
  resetMutation: ResetMutation,
  state: FormState,
) {
  return {
    onClearResult: () => state.setResult(null),
    onCloseModal: () => {
      state.setEmailMismatch(false);
      state.setModalVisible(false);
    },
    onCreate: () =>
      createClient(createMutation, state, () => {
        state.setConfirmEmail('');
        state.setAvatarUrl(state.availableAvatars[0] ?? '');
        state.setEmail('');
        state.setEmailMismatch(false);
        state.setFirstName('');
        state.setLastName('');
        state.setModalVisible(false);
      }),
    onOpenModal: () => {
      resetFormState(state);
      state.setModalVisible(true);
    },
    onResetPassword: () => resetClientPassword(resetMutation, state),
  };
}

function resetFormState(state: FormState): void {
  state.setAvatarUrl(state.availableAvatars[0] ?? '');
  state.setConfirmEmail('');
  state.setEmail('');
  state.setEmailMismatch(false);
  state.setFirstName('');
  state.setLastName('');
  state.setResult(null);
}

function createClient(
  createMutation: CreateMutation,
  state: FormState,
  onSuccess: () => void,
): void {
  if (!hasRequiredFields(state)) {
    return;
  }
  if (!emailsMatch(state.email, state.confirmEmail)) {
    state.setEmailMismatch(true);
    return;
  }
  state.setEmailMismatch(false);
  createMutation.mutate(
    {
      avatarUrl: state.avatarUrl || undefined,
      email: state.email,
      firstName: state.firstName,
      lastName: state.lastName,
      objectiveId: state.objectiveId || undefined,
    },
    {
      onSuccess: (created) => {
        state.setResult(created);
        onSuccess();
      },
    },
  );
}

function resetClientPassword(resetMutation: ResetMutation, state: FormState): void {
  if (!state.result) {
    return;
  }
  resetMutation.mutate(state.result.client.id, {
    onSuccess: (payload) => {
      state.setResult({
        ...state.result!,
        credentials: {
          temporaryPassword: payload.temporaryPassword,
          userCreated: false,
        },
      });
    },
  });
}

function hasRequiredFields(state: FormState): boolean {
  return (
    state.email.trim().length > 0 &&
    state.confirmEmail.trim().length > 0 &&
    state.firstName.trim().length > 0 &&
    state.lastName.trim().length > 0
  );
}

function emailsMatch(email: string, confirmEmail: string): boolean {
  return email.trim().toLowerCase() === confirmEmail.trim().toLowerCase();
}
