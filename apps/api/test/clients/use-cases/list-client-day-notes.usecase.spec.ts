import { NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../../src/common/auth-context/auth-context';
import { ListClientDayNotesUseCase } from '../../../src/modules/clients/application/use-cases/list-client-day-notes.usecase';

const context = { email: 'client@example.com' } as AuthContext;

function note(day: number) {
  return {
    content: `nota ${day}`,
    date: new Date(Date.UTC(2026, 0, day)),
    updatedAt: new Date(Date.UTC(2026, 0, day, 8)),
  };
}

describe('ListClientDayNotesUseCase', () => {
  const prisma = {
    client: { findFirst: jest.fn() },
    clientDayNote: { findMany: jest.fn() },
  };
  let useCase: ListClientDayNotesUseCase;

  beforeEach(() => {
    prisma.client.findFirst.mockReset();
    prisma.clientDayNote.findMany.mockReset();
    prisma.client.findFirst.mockResolvedValue({ id: 'client-1' });
    prisma.clientDayNote.findMany.mockResolvedValue([note(24)]);
    useCase = new ListClientDayNotesUseCase(prisma as never);
  });

  it('rejects an email that does not belong to an active client', async () => {
    prisma.client.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(context, {})).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.clientDayNote.findMany).not.toHaveBeenCalled();
  });

  it('searches without case and pages before a date', async () => {
    await useCase.execute(context, { before: '2026-10-24', query: '  Rodilla ' });

    expect(prisma.client.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { archivedAt: null, email: 'client@example.com' },
    });
    expect(prisma.clientDayNote.findMany).toHaveBeenCalledWith({
      orderBy: { date: 'desc' },
      select: { content: true, date: true, updatedAt: true },
      take: 31,
      where: {
        clientId: 'client-1',
        content: { contains: 'Rodilla', mode: 'insensitive' },
        date: { lt: new Date('2026-10-24') },
      },
    });
  });

  it('ignores a query shorter than two characters', async () => {
    await useCase.execute(context, { query: 'a' });

    expect(prisma.clientDayNote.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { clientId: 'client-1' } }));
  });

  it('returns thirty notes and the cursor of the last one when another page exists', async () => {
    prisma.clientDayNote.findMany.mockResolvedValue(Array.from({ length: 31 }, (_, index) => note(31 - index)));

    const result = await useCase.execute(context, {});

    expect(result.items).toHaveLength(30);
    expect(result.items[0]?.date).toBe('2026-01-31');
    expect(result.items[29]?.date).toBe('2026-01-02');
    expect(result.items[0]?.updatedAt).toBe('2026-01-31T08:00:00.000Z');
    expect(result.nextBefore).toBe('2026-01-02');
  });
});
