import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

export async function sessionFixture(db: PrismaClient) {
  const uid = randomUUID();
  const org = await db.organization.create({ data: { name: 'TP-33 ' + uid } });
  const user = await db.user.create({ data: { email: uid + '@example.test', supabaseUid: uid } });
  const member = await db.organizationMember.create({ data: { organizationId: org.id, userId: user.id, role: 'COACH' } });
  const objective = await db.clientObjective.create({ data: { code: uid, label: uid } });
  const client = await db.client.create({
    data: {
      organizationId: org.id,
      coachMembershipId: member.id,
      objectiveId: objective.id,
      email: uid + '@example.test',
      firstName: 'TP-33',
      lastName: 'Concurrency',
      createdBy: uid,
      updatedBy: uid,
    },
  });
  const template = await db.planTemplate.create({
    data: { name: 'TP-33', organizationId: org.id, coachMembershipId: member.id },
  });
  return {
    client,
    template,
    member,
    org,
    user,
    objective,
    context: { activeRole: 'client' as const, roles: ['client' as const], subject: uid, email: client.email },
    async create(startedAt: Date | null = null) {
      return db.sessionInstance.create({
        data: {
          organizationId: org.id,
          coachMembershipId: member.id,
          clientId: client.id,
          sourceTemplateId: template.id,
          sourceTemplateVersion: 1,
          sessionDate: new Date('2026-10-16'),
          status: startedAt ? 'IN_PROGRESS' : 'PENDING',
          startedAt,
          createdBy: uid,
          updatedBy: uid,
          items: { create: { displayName: 'TP-33 set' } },
        },
        include: { items: true },
      });
    },
    async cleanup() {
      await db.sessionInstance.deleteMany({ where: { clientId: client.id } });
      await db.client.delete({ where: { id: client.id } });
      await db.planTemplate.delete({ where: { id: template.id } });
      await db.clientObjective.delete({ where: { id: objective.id } });
      await db.organizationMember.delete({ where: { id: member.id } });
      await db.user.delete({ where: { id: user.id } });
      await db.organization.delete({ where: { id: org.id } });
    },
  };
}
export function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
