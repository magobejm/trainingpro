import { useState } from 'react';
import {
  useCreateClientMutation,
  useResetClientPasswordMutation,
  type CreateClientResult,
} from '../../data/hooks/useClientMutations';

type CreateMutation = ReturnType<typeof useCreateClientMutation>;
type ResetMutation = ReturnType<typeof useResetClientPasswordMutation>;

type FormState = {
  confirmEmail: string;
  email: string;
  emailMismatch: boolean;
  firstName: string;
  lastName: string;
  modalVisible: boolean;
  result: CreateClientResult | null;
  setConfirmEmail: (value: string) => void;
  setEmail: (value: string) => void;
  setEmailMismatch: (value: boolean) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setModalVisible: (value: boolean) => void;
  setResult: (value: CreateClientResult | null) => void;
};

export function useClientCreateForm(createMutation: CreateMutation) {
  const resetPasswordMutation = useResetClientPasswordMutation();
  const state = useFormState();
  const actions = createFormActions(createMutation, resetPasswordMutation, state);
  return {
    ...actions,
    ...state,
    isCreating: createMutation.isPending,
    isFormValid: !state.emailMismatch && hasRequiredFields(state),
    isResettingPassword: resetPasswordMutation.isPending,
  };
}

function useFormState(): FormState {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [email, setEmail] = useState('');
  const [emailMismatch, setEmailMismatch] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [result, setResult] = useState<CreateClientResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  return {
    confirmEmail,
    email,
    emailMismatch,
    firstName,
    lastName,
    modalVisible,
    result,
    setConfirmEmail,
    setEmail,
    setEmailMismatch,
    setFirstName,
    setLastName,
    setModalVisible,
    setResult,
  };
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
        state.setEmail('');
        state.setEmailMismatch(false);
        state.setFirstName('');
        state.setLastName('');
        state.setModalVisible(false);
      }),
    onOpenModal: () => state.setModalVisible(true),
    onResetPassword: () => resetClientPassword(resetMutation, state),
  };
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
      email: state.email,
      firstName: state.firstName,
      lastName: state.lastName,
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
