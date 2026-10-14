import { MIN_PASSWORD_LENGTH, parseRecoveryHash, parseRecoveryUrl, validateNewPassword } from '../password-recovery';

describe('parseRecoveryHash', () => {
  it('reads the tokens of a recovery link', () => {
    const hash = '#access_token=abc&expires_at=1&refresh_token=def&token_type=bearer&type=recovery';
    expect(parseRecoveryHash(hash)).toEqual({ accessToken: 'abc', refreshToken: 'def', status: 'ready' });
  });

  it('treats a recovery link without tokens as invalid', () => {
    expect(parseRecoveryHash('#type=recovery&access_token=abc')).toEqual({ status: 'invalid' });
  });

  it('flags an expired link reported by Supabase', () => {
    const hash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
    expect(parseRecoveryHash(hash)).toEqual({ status: 'invalid' });
  });

  it('ignores any other hash, including a normal magic-link login', () => {
    expect(parseRecoveryHash('')).toEqual({ status: 'none' });
    expect(parseRecoveryHash('#section')).toEqual({ status: 'none' });
    expect(parseRecoveryHash('#access_token=abc&refresh_token=def&type=magiclink')).toEqual({ status: 'none' });
  });
});

describe('parseRecoveryUrl', () => {
  const tokens = '#access_token=abc&refresh_token=def&type=recovery';

  it('reads the fragment of a full link', () => {
    expect(parseRecoveryUrl(`trainerpro://reset-password${tokens}`)).toEqual({
      accessToken: 'abc',
      refreshToken: 'def',
      status: 'ready',
    });
  });

  it('reads the query when the fragment was dropped', () => {
    const url = 'trainerpro://reset-password?access_token=abc&refresh_token=def&type=recovery';
    expect(parseRecoveryUrl(url)).toEqual({ accessToken: 'abc', refreshToken: 'def', status: 'ready' });
  });

  it('prefers the fragment when both are present', () => {
    const url = `trainerpro://reset-password?type=magiclink#access_token=abc&refresh_token=def&type=recovery`;
    expect(parseRecoveryUrl(url).status).toBe('ready');
  });

  it('ignores a link that is not a recovery', () => {
    expect(parseRecoveryUrl('trainerpro://reset-password')).toEqual({ status: 'none' });
    expect(parseRecoveryUrl('https://trainer-pro-mobile.expo.app/')).toEqual({ status: 'none' });
  });
});

describe('validateNewPassword', () => {
  it('rejects passwords that are too short', () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validateNewPassword(short, short)).toBe('tooShort');
  });

  it('rejects a confirmation that does not match', () => {
    expect(validateNewPassword('long-enough-1', 'long-enough-2')).toBe('mismatch');
  });

  it('accepts a long enough password that matches its confirmation', () => {
    const valid = 'a'.repeat(MIN_PASSWORD_LENGTH);
    expect(validateNewPassword(valid, valid)).toBeNull();
  });
});
