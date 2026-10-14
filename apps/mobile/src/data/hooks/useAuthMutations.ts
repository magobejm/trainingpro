import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import {
  completePasswordRecovery,
  loginWithPassword,
  logout,
  requestPasswordReset,
  type PasswordRecoveryInput,
} from '../auth-service';

export type LoginInput = {
  email: string;
  password: string;
};

export function useLoginMutation(): UseMutationResult<void, Error, LoginInput> {
  return useMutation({
    mutationFn: runLogin,
  });
}

export function usePasswordResetMutation(): UseMutationResult<void, Error, string> {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useCompleteRecoveryMutation(): UseMutationResult<void, Error, PasswordRecoveryInput> {
  return useMutation({ mutationFn: completePasswordRecovery });
}

export function useLogout(): () => void {
  return () => {
    void logout();
  };
}

async function runLogin(input: LoginInput): Promise<void> {
  await loginWithPassword(input.email, input.password);
}
