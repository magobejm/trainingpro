import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { loginWithPassword, logout } from '../auth-service';

export type LoginInput = {
  email: string;
  password: string;
};

export function useLoginMutation(): UseMutationResult<void, Error, LoginInput> {
  return useMutation({
    mutationFn: runLogin,
  });
}

export function useLogout(): () => void {
  return () => {
    void logout();
  };
}

async function runLogin(input: LoginInput): Promise<void> {
  await loginWithPassword(input.email, input.password);
}
