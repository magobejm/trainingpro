import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SaveClientWeeklyLoadUseCase } from '../../../src/modules/clients/application/use-cases/save-client-weekly-load.usecase';

const context = { activeRole: 'client' as const, email: 'c@example.com', roles: ['client' as const], subject: 'u1' };

describe('SaveClientWeeklyLoadUseCase', () => {
  const prisma = {
    client: { findFirst: jest.fn() },
    clientWeeklyLoad: { deleteMany: jest.fn(), upsert: jest.fn() },
  };
  let useCase: SaveClientWeeklyLoadUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
    useCase = new SaveClientWeeklyLoadUseCase(prisma as never);
  });

  it('guarda el texto recortado para el lunes indicado', async () => {
    await expect(useCase.execute(context, '2026-11-09', '  Entrega del proyecto ')).resolves.toEqual({ saved: true });
    expect(prisma.clientWeeklyLoad.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ content: 'Entrega del proyecto' }) }),
    );
  });

  it('borra la nota cuando llega vacía', async () => {
    await expect(useCase.execute(context, '2026-11-09', '   ')).resolves.toEqual({ saved: false });
    expect(prisma.clientWeeklyLoad.deleteMany).toHaveBeenCalled();
  });

  it('rechaza fechas que no son lunes', async () => {
    await expect(useCase.execute(context, '2026-11-10', 'x')).rejects.toThrow(BadRequestException);
  });

  it('falla sin perfil de cliente', async () => {
    prisma.client.findFirst.mockResolvedValue(null);
    await expect(useCase.execute(context, '2026-11-09', 'x')).rejects.toThrow(NotFoundException);
  });
});
