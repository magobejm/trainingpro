import { ForbiddenException } from '@nestjs/common';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { EnsureSessionUseCase } from '../../src/modules/sessions/application/use-cases/ensure-session.usecase';

const context = { activeRole: 'coach', roles: ['coach'], subject: 'coach-a' } as AuthContext;
const input = {
  clientId: '11111111-1111-4111-8111-111111111111',
  sessionDate: new Date('2026-10-06T00:00:00.000Z'),
  templateId: '22222222-2222-4222-8222-222222222222',
};

describe('EnsureSessionUseCase ownership', () => {
  it('rejects a client the coach does not own and does not create the session', async () => {
    const repository = { ensureSession: jest.fn() };
    const clientAccess = { canAccess: jest.fn().mockResolvedValue(false) };
    const useCase = new EnsureSessionUseCase(repository as never, clientAccess as never);

    await expect(useCase.execute(context, input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.ensureSession).not.toHaveBeenCalled();
  });

  it('creates the session when the coach owns the client', async () => {
    const session = { id: 'session-1' };
    const repository = { ensureSession: jest.fn().mockResolvedValue(session) };
    const clientAccess = { canAccess: jest.fn().mockResolvedValue(true) };
    const useCase = new EnsureSessionUseCase(repository as never, clientAccess as never);

    await expect(useCase.execute(context, input)).resolves.toBe(session);
    expect(clientAccess.canAccess).toHaveBeenCalledWith(context, input.clientId);
    expect(repository.ensureSession).toHaveBeenCalledWith(context, input);
  });
});
