import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { loginWithPassword, type LoginResult } from '../auth-service';
import { useAuthStore } from '../../store/auth.store';

export type LoginInput = {
  email: string;
  password: string;
};

export function useLoginMutation(): UseMutationResult<LoginResult, Error, LoginInput> {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation({
    mutationFn: runLogin,
    onSuccess: (result) => {
      setSession(result.accessToken);
    },
  });
}

async function runLogin(input: LoginInput): Promise<LoginResult> {
  return loginWithPassword(input.email, input.password);
}
