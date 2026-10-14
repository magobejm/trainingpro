const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ResetNotice = { isError: boolean; text: string };

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function readResetNotice(
  state: { isError: boolean; isPending: boolean; isSuccess: boolean },
  t: (key: string) => string,
): ResetNotice | null {
  if (state.isPending) return { isError: false, text: t('auth.login.forgot.sending') };
  if (state.isSuccess) return { isError: false, text: t('auth.login.forgot.sent') };
  if (state.isError) return { isError: true, text: t('auth.login.forgot.error') };
  return null;
}
