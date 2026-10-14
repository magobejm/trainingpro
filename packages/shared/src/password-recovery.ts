export const MIN_PASSWORD_LENGTH = 8;

export type RecoveryHash =
  | { status: 'none' }
  | { status: 'invalid' }
  | { accessToken: string; refreshToken: string; status: 'ready' };

export type PasswordIssue = 'mismatch' | 'tooShort';

/** Lee el fragmento (#...) con el que Supabase devuelve al usuario desde el correo de recuperación. */
export function parseRecoveryHash(hash: string): RecoveryHash {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (params.get('type') === 'recovery') {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    return accessToken && refreshToken ? { accessToken, refreshToken, status: 'ready' } : { status: 'invalid' };
  }
  return params.has('error') || params.has('error_code') ? { status: 'invalid' } : { status: 'none' };
}

/**
 * Lee un enlace completo. Los tokens van en el fragmento; si el sistema se lo queda,
 * también se aceptan en la query.
 */
export function parseRecoveryUrl(url: string): RecoveryHash {
  const hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    return parseRecoveryHash(url.slice(hashIndex));
  }
  const queryIndex = url.indexOf('?');
  if (queryIndex >= 0) {
    return parseRecoveryHash(url.slice(queryIndex + 1));
  }
  return { status: 'none' };
}

export function validateNewPassword(password: string, confirmation: string): PasswordIssue | null {
  if (password.length < MIN_PASSWORD_LENGTH) return 'tooShort';
  return password === confirmation ? null : 'mismatch';
}
