import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function getCoachMembership() {
  console.log('Searching for coach membership...');
  const membership = await prisma.organizationMember.findFirst({
    where: {
      role: Role.COACH,
      isActive: true,
      archivedAt: null,
    },
    select: { id: true, organizationId: true },
  });

  if (!membership) {
    console.error('No active coach membership found');
    process.exit(1);
  }

  console.log(`Found coach membership: ${membership.id} (Org: ${membership.organizationId})`);
  return membership;
}

async function updateCoachItems(membershipId: string, organizationId: string) {
  const exerciseCount = await prisma.exercise.updateMany({
    where: {
      scope: 'COACH',
      coachMembershipId: null,
    },
    data: {
      coachMembershipId: membershipId,
      organizationId: organizationId,
    },
  });

  const cardioCount = await prisma.cardioMethod.updateMany({
    where: {
      scope: 'COACH',
      coachMembershipId: null,
    },
    data: {
      coachMembershipId: membershipId,
      organizationId: organizationId,
    },
  });

  return { exerciseCount: exerciseCount.count, cardioCount: cardioCount.count };
}

async function run() {
  const membership = await getCoachMembership();
  const { exerciseCount, cardioCount } = await updateCoachItems(membership.id, membership.organizationId);

  console.log(`Updated ${exerciseCount} exercises and ${cardioCount} cardio methods.`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
