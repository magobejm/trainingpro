import { describe, expect, it } from 'vitest';
import { isValidEmail, readResetNotice } from './login-form.logic';

const t = (key: string): string => key;
const IDLE = { isError: false, isPending: false, isSuccess: false };

describe('isValidEmail', () => {
  it('accepts a normal address, ignoring surrounding spaces', () => {
    expect(isValidEmail('coach@example.com')).toBe(true);
    expect(isValidEmail('  coach@example.com ')).toBe(true);
  });

  it.each(['', 'coach', 'coach@', '@example.com', 'coach@example', 'co ach@example.com', 'a@b@example.com'])(
    'rejects %j',
    (value) => {
      expect(isValidEmail(value)).toBe(false);
    },
  );
});

describe('readResetNotice', () => {
  it('shows nothing before the user asks for a reset', () => {
    expect(readResetNotice(IDLE, t)).toBeNull();
  });

  it('reports sending, success and failure', () => {
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
