import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { loginWithPassword, type LoginResult } from '../auth-service';
import { clearSessionExpired } from '../session-end';
import { useAuthStore } from '../../store/auth.store';

export type LoginInput = {
  email: string;
  password: string;
};

export function useLoginMutation(): UseMutationResult<LoginResult, Error, LoginInput> {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: runLogin,
    onSuccess: (result) => {
      clearSessionExpired();
      queryClient.clear();
      setSession(result.accessToken);
    },
  });
}

async function runLogin(input: LoginInput): Promise<LoginResult> {
  return loginWithPassword(input.email, input.password);
}
