import { NotFoundException } from '@nestjs/common';
import { LibraryCopyService } from '../../src/modules/library/application/library-copy.service';

const membership = { id: 'coach-1', organizationId: 'org-1' };

function build(source: Record<string, unknown> | null) {
  const created: Array<Record<string, unknown>> = [];
  const prisma = {
    organizationMember: { findFirst: jest.fn().mockResolvedValue(membership) },
    exercise: {
      findFirst: jest.fn().mockResolvedValue(source),
      create: jest.fn(async ({ data }) => {
        created.push(data);
        return { id: 'new', ...data };
      }),
    },
    exerciseMuscleGroupAssignment: { findMany: jest.fn().mockResolvedValue([{ muscleGroupId: 'chest' }]) },
    food: {
      findFirst: jest.fn().mockResolvedValue(source),
      create: jest.fn(async ({ data }) => {
        created.push(data);
        return { id: 'new', ...data };
      }),
    },
  };
  return { created, service: new LibraryCopyService(prisma as never) };
}

const globalExercise = {
  id: 'src',
  scope: 'GLOBAL',
  coachMembershipId: null,
  organizationId: null,
  name: 'Sentadilla',
  equipmentId: 'bar',
  createdAt: new Date(),
  updatedAt: new Date(),
  archivedAt: null,
};

describe('LibraryCopyService', () => {
  it('copies a global exercise as a coach-owned item with the new name and muscle groups', async () => {
    const { created, service } = build(globalExercise);
    await service.copyExercise('strength', 'src', { name: '  Mi sentadilla ' }, 'subject');
    expect(created[0]).toMatchObject({
      name: 'Mi sentadilla',
      scope: 'COACH',
      coachMembershipId: 'coach-1',
      organizationId: 'org-1',
      equipmentId: 'bar',
      muscleGroups: { create: [{ muscleGroupId: 'chest' }] },
    });
    expect(created[0]).not.toHaveProperty('id');
    expect(created[0]).not.toHaveProperty('archivedAt');
  });

  it('rejects an item the coach cannot see', async () => {
    const { service } = build(null);
    await expect(service.copyFood('missing', { name: 'x' }, 'subject')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires a name', async () => {
    const { service } = build(globalExercise);
    await expect(service.copyExercise('strength', 'src', { name: '   ' }, 'subject')).rejects.toThrow();
  });
});
