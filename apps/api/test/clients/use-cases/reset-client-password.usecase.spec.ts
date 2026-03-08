import { ResetClientPasswordUseCase } from '../../../src/modules/clients/application/use-cases/reset-client-password.usecase';

const mockGetClientUseCase = {
  execute: jest.fn(),
};

const mockAuthProvisioner = {
  rotateClientAuthPassword: jest.fn(),
};

let useCase: ResetClientPasswordUseCase;

beforeEach(() => {
  mockGetClientUseCase.execute.mockReset();
  mockAuthProvisioner.rotateClientAuthPassword.mockReset();
  useCase = new ResetClientPasswordUseCase(
    mockGetClientUseCase as never,
    mockAuthProvisioner as never,
  );
});

it('should get client and rotate password, returning temporary password', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  const client = { id: 'client-123', email: 'client@example.com' };
  mockGetClientUseCase.execute.mockResolvedValue(client);
  mockAuthProvisioner.rotateClientAuthPassword.mockResolvedValue({
    temporaryPassword: 'New@5678',
  });

  const result = await useCase.execute(context, 'client-123');

  expect(mockGetClientUseCase.execute).toHaveBeenCalledWith(context, 'client-123');
  expect(mockAuthProvisioner.rotateClientAuthPassword).toHaveBeenCalledWith(client.email);
  expect(result).toEqual({ temporaryPassword: 'New@5678' });
});

it('should propagate error when client is not found', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  mockGetClientUseCase.execute.mockRejectedValue(new Error('Client not found'));

  await expect(useCase.execute(context, 'bad-id')).rejects.toThrow('Client not found');
  expect(mockAuthProvisioner.rotateClientAuthPassword).not.toHaveBeenCalled();
});

it('should propagate auth provisioner errors', async () => {
  const context = { subject: 'coach-1', role: 'coach' } as never;
  mockGetClientUseCase.execute.mockResolvedValue({ id: 'c123', email: 'c@c.com' });
  mockAuthProvisioner.rotateClientAuthPassword.mockRejectedValue(new Error('Auth service down'));

  await expect(useCase.execute(context, 'client-123')).rejects.toThrow('Auth service down');
});
