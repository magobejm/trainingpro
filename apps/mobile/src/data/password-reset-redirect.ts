export const MOBILE_WEB_RESET_URL = 'https://trainer-pro-mobile.expo.app';
export const NATIVE_RESET_PATH = 'reset-password';

/** En nativo solo se procesan enlaces cuyo destino es la pantalla de recuperación. */
export function isNativeRecoveryUrl(url: string | null): url is string {
  if (!url) return false;
  const beforeHash = url.split('#')[0]?.split('?')[0] ?? '';
  return beforeHash.replace(/\/+$/, '').endsWith(NATIVE_RESET_PATH);
}

export function resolvePasswordResetRedirect(platform: string, createUrl: (path: string) => string): string {
  if (platform === 'web') {
    return MOBILE_WEB_RESET_URL;
  }
  return createUrl(NATIVE_RESET_PATH);
}
