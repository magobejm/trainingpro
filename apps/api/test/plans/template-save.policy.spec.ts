import { ConflictException } from '@nestjs/common';
import { TemplateKind } from '@prisma/client';
import { assertExpectedTemplateVersion } from '../../src/modules/plans/application/template-save.policy';
import { PlansRoutineRepository } from '../../src/modules/plans/infra/prisma/plans-repository/plans-routine.repository';

const auth = { activeRole: 'coach' as const, roles: ['coach' as const], subject: 'coach-uid' };

describe('template save', () => {
  it('rejects a stale template version with 409 and does not delete days', async () => {
    expect(() => assertExpectedTemplateVersion(1, 2)).toThrow(ConflictException);
    const deleteMany = jest.fn();
    const repository = new PlansRoutineRepository(prismaWith({ deleteMany }) as never);
    await expect(
      repository.updateRoutineTemplate(auth, 'tpl-1', {
        days: [{ dayIndex: 1, title: 'Día 1' }],
        expectedTemplateVersion: 1,
        name: 'Rutina',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('returns the existing template when the same clientSaveId is sent again', async () => {
    const create = jest.fn();
    const repository = new PlansRoutineRepository(prismaWith({ create, existingId: 'tpl-1' }) as never);
    const saved = await repository.createRoutineTemplate(auth, {
      clientSaveId: '6f1e1b1a-6b1e-4a1e-8c1e-1b1e1b1e1b1e',
      days: [{ dayIndex: 1, title: 'Día 1' }],
      name: 'Rutina',
    });
    expect(saved.id).toBe('tpl-1');
    expect(create).not.toHaveBeenCalled();
  });
});

function prismaWith(options: { create?: jest.Mock; deleteMany?: jest.Mock; existingId?: string }) {
  const template = {
    assignedClients: [],
    coachMembershipId: 'coach-1',
    createdAt: new Date(),
    days: [],
    id: 'tpl-1',
    name: 'Rutina',
    neats: [],
    scope: 'COACH',
    templateVersion: 2,
    updatedAt: new Date(),
  };
  return {
    $queryRaw: async () => [],
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        planDay: { deleteMany: options.deleteMany ?? jest.fn(), findMany: async () => [] },
        planTemplate: {
          findFirst: async () => ({ id: 'tpl-1', templateVersion: 2 }),
        },
      }),
    organizationMember: {
      findFirst: async () => ({ id: 'coach-1', organizationId: 'org-1' }),
    },
    planTemplate: {
      create: options.create ?? jest.fn(),
      findFirst: async (args: {
        select?: { templateVersion?: boolean };
        where?: { clientSaveId?: string; kind?: TemplateKind };
      }) => {
        if (args.where?.clientSaveId) return options.existingId ? { id: options.existingId } : null;
        if (args.select?.templateVersion) return { id: 'tpl-1', templateVersion: 2 };
        return template;
      },
    },
  };
}
