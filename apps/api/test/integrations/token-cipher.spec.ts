import { decryptToken, encryptToken, readState, signState } from '../../src/common/crypto/token-cipher';

describe('integration tokens', () => {
  const secret = 'integrations-test-secret';

  it('round-trips a token and rejects a tampered payload', () => {
    const encoded = encryptToken('access-token', secret);
    expect(decryptToken(encoded, secret)).toBe('access-token');
    expect(() => decryptToken(`${encoded}x`, secret)).toThrow();
  });

  it('rejects an OAuth state whose signature does not match', () => {
    const token = signState({ clientId: 'abc', provider: 'polar' }, secret);
    expect(readState(token, secret)?.provider).toBe('polar');
    expect(readState(`${token}x`, secret)).toBeNull();
  });
});
