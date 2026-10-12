import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = {
  resetPasswordForEmail: vi.fn(),
  setSession: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
};

vi.mock('./supabase-client', () => ({ createSupabaseClient: () => ({ auth }) }));

const { completePasswordRecovery, requestPasswordReset } = await import('./auth-service');

const INPUT = { accessToken: 'access', password: 'new-password-1', refreshToken: 'refresh' };

beforeEach(() => {
  auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  auth.setSession.mockResolvedValue({ error: null });
  auth.updateUser.mockResolvedValue({ error: null });
  auth.signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('requestPasswordReset', () => {
  it('asks Supabase to send the email and come back to this app', async () => {
    vi.stubGlobal('location', { origin: 'https://app.example.com' });
    await requestPasswordReset('coach@example.com');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('coach@example.com', {
      redirectTo: 'https://app.example.com',
    });
  });

  it('does not set a redirect when there is no browser location', async () => {
    await requestPasswordReset('coach@example.com');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('coach@example.com', undefined);
  });

  it('surfaces the Supabase error', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: { message: 'rate limit' } });
    await expect(requestPasswordReset('coach@example.com')).rejects.toThrow('rate limit');
  });
});

describe('completePasswordRecovery', () => {
  it('opens the link session, sets the password and then closes that session', async () => {
    await completePasswordRecovery(INPUT);
    expect(auth.setSession).toHaveBeenCalledWith({ access_token: 'access', refresh_token: 'refresh' });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password-1' });
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(auth.setSession.mock.invocationCallOrder[0]).toBeLessThan(auth.updateUser.mock.invocationCallOrder[0] ?? 0);
    expect(auth.updateUser.mock.invocationCallOrder[0]).toBeLessThan(auth.signOut.mock.invocationCallOrder[0] ?? 0);
  });

  it('stops when the link session cannot be opened', async () => {
    auth.setSession.mockResolvedValue({ error: { message: 'Invalid Refresh Token' } });
    await expect(completePasswordRecovery(INPUT)).rejects.toThrow('Invalid Refresh Token');
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('keeps the session open when the password is rejected so the user can retry', async () => {
    auth.updateUser.mockResolvedValue({ error: { message: 'Password is too weak' } });
    await expect(completePasswordRecovery(INPUT)).rejects.toThrow('Password is too weak');
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
