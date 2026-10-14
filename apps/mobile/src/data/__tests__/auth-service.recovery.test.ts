const mockAuth = {
  refreshSession: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  setSession: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  updateUser: jest.fn(),
};

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `trainerpro://${path}`,
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('../supabase-client', () => ({
  getSupabaseClient: () => ({ auth: mockAuth }),
}));

import { completePasswordRecovery, requestPasswordReset } from '../auth-service';

const INPUT = { accessToken: 'access', password: 'long-enough', refreshToken: 'refresh' };

describe('password recovery auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.updateUser.mockResolvedValue({ error: null });
    mockAuth.signOut.mockResolvedValue({ error: null });
  });

  it('asks Supabase to email the native reset link', async () => {
    await requestPasswordReset('coach@example.com');

    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('coach@example.com', {
      redirectTo: 'trainerpro://reset-password',
    });
  });

  it('sets the temporary session, saves the password and signs that session out', async () => {
    await completePasswordRecovery(INPUT);

    expect(mockAuth.setSession).toHaveBeenCalledWith({ access_token: 'access', refresh_token: 'refresh' });
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'long-enough' });
    expect(mockAuth.signOut).toHaveBeenCalledWith();
  });

  it('stops when the recovery session cannot be opened', async () => {
    mockAuth.setSession.mockResolvedValue({ error: { message: 'Invalid Refresh Token' } });

    await expect(completePasswordRecovery(INPUT)).rejects.toThrow('Invalid Refresh Token');
    expect(mockAuth.updateUser).not.toHaveBeenCalled();
  });
});
