import { CreateClientUseCase } from '../../../src/modules/clients/application/use-cases/create-client.usecase';

const mockRepository = {
  createClient: jest.fn(),
};

const mockAuthProvisioner = {
  ensureClientAuthUser: jest.fn(),
};

let useCase: CreateClientUseCase;

beforeEach(() => {
  mockRepository.createClient.mockReset();
  mockAuthProvisioner.ensureClientAuthUser.mockReset();
  useCase = new CreateClientUseCase(mockRepository as never, mockAuthProvisioner as never);
});

it('should create auth user and client record, returning both', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const input = { email: 'client@example.com', firstName: 'Ana' };
  const authUser = { userId: 'supabase-uid-123', temporaryPassword: 'Tmp@1234', created: true };
  const client = { id: 'client-123', email: 'client@example.com' };
  mockAuthProvisioner.ensureClientAuthUser.mockResolvedValue(authUser);
  mockRepository.createClient.mockResolvedValue(client);

  const result = await useCase.execute(context, input as never);

  expect(mockAuthProvisioner.ensureClientAuthUser).toHaveBeenCalledWith(input.email);
  expect(mockRepository.createClient).toHaveBeenCalledWith(context, {
    ...input,
    clientSupabaseUid: authUser.userId,
  });
  expect(result).toEqual({
    client,
    credentials: {
      temporaryPassword: authUser.temporaryPassword,
      userCreated: authUser.created,
    },
  });
});

it('should reuse auth user when email already exists', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const input = { email: 'existing@example.com', firstName: 'Pedro' };
  const authUser = { userId: 'existing-uid', temporaryPassword: 'Tmp@5678', created: false };
  const client = { id: 'new-client', email: 'existing@example.com' };
  mockAuthProvisioner.ensureClientAuthUser.mockResolvedValue(authUser);
  mockRepository.createClient.mockResolvedValue(client);

  const result = await useCase.execute(context, input as never);
  expect(result.credentials.userCreated).toBe(false);
});

it('should propagate auth provisioner errors', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  mockAuthProvisioner.ensureClientAuthUser.mockRejectedValue(new Error('Auth error'));

  await expect(useCase.execute(context, { email: 'bad@test.com' } as never)).rejects.toThrow(
    'Auth error',
  );
});

it('should propagate repository errors (e.g. client limit exceeded)', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  mockAuthProvisioner.ensureClientAuthUser.mockResolvedValue({
    userId: 'uid',
    temporaryPassword: 'pass',
    created: true,
  });
  mockRepository.createClient.mockRejectedValue(new Error('Limit exceeded'));

  await expect(useCase.execute(context, { email: 'test@test.com' } as never)).rejects.toThrow(
    'Limit exceeded',
  );
});
