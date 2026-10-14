import { isValidEmail, readResetNotice } from '../login-form.logic';

const t = (key: string): string => key;
const IDLE = { isError: false, isPending: false, isSuccess: false };

describe('readResetNotice', () => {
  it('reports sending, success and failure', () => {
    expect(isValidEmail('  coach@example.com ')).toBe(true);
    expect(isValidEmail('coach')).toBe(false);
    expect(readResetNotice(IDLE, t)).toBeNull();
    expect(readResetNotice({ ...IDLE, isPending: true }, t)).toEqual({
      isError: false,
      text: 'auth.login.forgot.sending',
    });
    expect(readResetNotice({ ...IDLE, isSuccess: true }, t)).toEqual({
      isError: false,
      text: 'auth.login.forgot.sent',
    });
    expect(readResetNotice({ ...IDLE, isError: true }, t)).toEqual({
      isError: true,
      text: 'auth.login.forgot.error',
    });
  });
});
