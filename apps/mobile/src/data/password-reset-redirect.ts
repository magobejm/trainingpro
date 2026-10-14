export const MOBILE_WEB_RESET_URL = 'https://trainer-pro-mobile.expo.app';
export const NATIVE_RESET_PATH = 'reset-password';

export function resolvePasswordResetRedirect(platform: string, createUrl: (path: string) => string): string {
  if (platform === 'web') {
    return MOBILE_WEB_RESET_URL;
  }
  return createUrl(NATIVE_RESET_PATH);
}
