import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Counting plans...');
    const counts = await prisma.planTemplate.groupBy({
      by: ['kind', 'scope'],
      _count: true,
      where: { archivedAt: null },
    });
    console.log('Plan counts:', JSON.stringify(counts, null, 2));

    const globalPlans = await prisma.planTemplate.findMany({
      where: { scope: 'GLOBAL', archivedAt: null },
      select: { id: true, name: true, kind: true, scope: true },
    });
    console.log('Global plans:', JSON.stringify(globalPlans, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
