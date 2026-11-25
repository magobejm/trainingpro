import { useAuthStore } from '../../store/auth.store';

/** Credenciales para llamar a la API; null mientras no hay sesión o rol activo. */
export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}

export type Auth = NonNullable<ReturnType<typeof useAuth>>;
